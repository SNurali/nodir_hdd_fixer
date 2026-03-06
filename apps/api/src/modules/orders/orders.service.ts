import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    OrderEntity,
    OrderDetailEntity,
    OrderLifecycleEntity,
    OrderPriceHistoryEntity,
    ClientEntity,
    UserEntity,
    NotificationEntity,
} from '../../database/entities';
import { TCreateOrderDto, TPaginationDto } from '@hdd-fixer/shared';
import {
    canTransition,
    validateTransitionRequirements,
    OrderRole,
} from './order-state-machine';
import { AuditService } from './audit.service';
import { StateMachineService } from './state-machine.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectRepository(OrderDetailEntity)
        private readonly detailRepo: Repository<OrderDetailEntity>,
        @InjectRepository(OrderLifecycleEntity)
        private readonly lifecycleRepo: Repository<OrderLifecycleEntity>,
        @InjectRepository(OrderPriceHistoryEntity)
        private readonly priceHistoryRepo: Repository<OrderPriceHistoryEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(NotificationEntity)
        private readonly notifRepo: Repository<NotificationEntity>,
        @InjectQueue('notifications')
        private readonly notifQueue: Queue,
        private readonly auditService: AuditService,
        private readonly stateMachineService: StateMachineService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Helper to get system user ID (for automated actions)
    private async getSystemUserId(): Promise<string> {
        // In a real app, you might have a dedicated 'system' user
        // For now, we'll return a placeholder - in most cases this won't be used
        // since userId is usually provided by the request
        return '00000000-0000-0000-0000-000000000000';
    }

    // ===== CREATE ORDER =====
    async create(dto: TCreateOrderDto, user: any) {
        let clientId = dto.client_id;
        let client: ClientEntity | null = null;

        const guestName = dto.guest_name?.trim();
        const guestTelegram = dto.guest_telegram?.trim();
        const guestEmail = dto.guest_email?.trim();

        // If client role, find their client record
        if (user?.role_name === 'client' && user?.id) {
            client = await this.clientRepo.findOne({
                where: { user_id: user?.id },
            });
            if (!client) throw new BadRequestException('Client record not found for user');
            clientId = client.id;
        }

        // Guest checkout: create client on the fly
        if (!clientId && (dto.guest_name || dto.guest_phone)) {
            if (!dto.guest_phone) {
                throw new BadRequestException('Guest phone is required');
            }

            // Check if client exists by phone
            let guestClient = await this.clientRepo.findOne({
                where: { phone: dto.guest_phone },
            });

            if (!guestClient) {
                // Create new client record
                const newClient = this.clientRepo.create({
                    full_name: guestName || 'Guest Client',
                    phone: dto.guest_phone,
                    telegram: guestTelegram || null,
                    email: guestEmail || null,
                    preferred_language: dto.language || 'ru',
                });
                guestClient = await this.clientRepo.save(newClient);
            }

            if (!guestClient) {
                throw new BadRequestException('Client not found after guest checkout processing');
            }
            clientId = guestClient.id;
            // Keep discovered/created client for later contact sync.
            client = guestClient;
        }

        if (!clientId) {
            throw new BadRequestException('client_id or guest information is required');
        }

        if (!client) {
            client = await this.clientRepo.findOne({ where: { id: clientId } });
        }
        if (!client) throw new NotFoundException('Client not found');

        // Sync provided contact fields into client profile so order card shows fresh data.
        let shouldUpdateClient = false;
        if (guestName && guestName !== client.full_name) {
            client.full_name = guestName;
            shouldUpdateClient = true;
        }
        if (dto.guest_telegram !== undefined) {
            const normalizedTelegram = guestTelegram || null;
            if ((client.telegram || null) !== normalizedTelegram) {
                client.telegram = normalizedTelegram;
                shouldUpdateClient = true;
            }
        }
        if (dto.guest_email !== undefined) {
            const normalizedEmail = guestEmail || null;
            if ((client.email || null) !== normalizedEmail) {
                client.email = normalizedEmail;
                shouldUpdateClient = true;
            }
        }
        if (dto.language && dto.language !== client.preferred_language) {
            client.preferred_language = dto.language;
            shouldUpdateClient = true;
        }
        if (shouldUpdateClient) {
            client = await this.clientRepo.save(client);
        }

        // Calculate totals
        const totalQty = dto.details.length;
        const totalPrice = dto.details.reduce((sum, d) => sum + (d.price || 0), 0);

        // Generate public tracking token
        const crypto = await import('crypto');
        const publicTrackingToken = crypto.randomBytes(20).toString('hex'); // 40-character hex string

        // Create order entity
        const order = this.orderRepo.create({
            client_id: Array.isArray(clientId) ? clientId[0] : clientId,
            language: dto.language || client.preferred_language || 'ru',
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            status: 'new',
            total_qty: totalQty,
            total_price_uzs: totalPrice,
            // Initialize currency rates (these could come from a service in the future)
            currency_rate_usd: 12500,
            currency_rate_eur: 13500,
            created_by: user?.id || await this.getSystemUserId(),
            public_tracking_token: publicTrackingToken, // Add the tracking token
        });
        const savedOrder = await this.orderRepo.save(order) as OrderEntity;

        // Create details
        for (const detail of dto.details) {
            const orderDetail = this.detailRepo.create({
                order_id: savedOrder.id,
                service_id: detail.service_id,
                equipment_id: detail.equipment_id,
                issue_id: detail.issue_id,
                description_of_issue: detail.description_of_issue || null,
                price: detail.price || 0,
                attached_to: detail.attached_to || null,
                attached_at: detail.attached_to ? new Date() : null,
            });
            await this.detailRepo.save(orderDetail);

            // Notify master if assigned
            if (detail.attached_to) {
                await this.sendNotification(
                    detail.attached_to,
                    savedOrder.id,
                    'order_assigned',
                    savedOrder.language,
                );
            }
        }

        // If no master assigned to any detail, notify admins
        const hasUnassigned = dto.details.some((d) => !d.attached_to);
        if (hasUnassigned) {
            await this.notifyAdmins(savedOrder.id, 'order_needs_assignment', savedOrder.language);
        } else {
            savedOrder.status = 'assigned';
            await this.orderRepo.save(savedOrder);
            await this.notifyClientStatusChange(savedOrder, 'assigned');
        }

        // Add lifecycle entry
        await this.addLifecycle(savedOrder.id, null, 'Заказ создан', 0, user?.id || await this.getSystemUserId(), {
            actionType: 'order_created',
        });

        return this.findOne(savedOrder.id, user);
    }

    // ===== GET ALL ORDERS =====
    async findAll(query: TPaginationDto, user: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        const queryBuilder = this.orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.client', 'client')
            .orderBy('order.created_at', 'DESC');

        if (user?.role_name === 'master') {
            queryBuilder.innerJoin('order.details', 'detail')
                .andWhere('detail.attached_to = :masterId', { masterId: user.id });
        }

        const [data, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ===== GET USER'S ORDERS =====
    async findMyOrders(userId: string, query: TPaginationDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        // First get the client record for this user
        const client = await this.clientRepo.findOne({
            where: { user_id: userId },
        });

        if (!client) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        const [data, total] = await this.orderRepo.findAndCount({
            where: { client_id: client.id },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ===== GET MASTER'S ASSIGNED ORDERS =====
    async findAssignedOrders(masterId: string, query: TPaginationDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        // Find order details assigned to this master
        const [details, totalDetails] = await this.detailRepo.findAndCount({
            where: { attached_to: masterId },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        // Get the associated orders
        const orderIds = details.map((d) => d.order_id);
        const orders = await this.orderRepo.findByIds(orderIds);

        // Merge details with orders
        const data = orders.map((order) => {
            const orderDetails = details.filter((d) => d.order_id === order.id);
            return {
                ...order,
                details: orderDetails,
            };
        });

        return {
            data,
            meta: {
                total: totalDetails,
                page,
                limit,
                totalPages: Math.ceil(totalDetails / limit),
            },
        };
    }

    // ===== GET SINGLE ORDER =====
    async findOne(id: string, user: any) {
        // Build relations array dynamically
        const relations: string[] = [
            'details',
            'details.service',
            'details.equipment',
            'details.issue',
            'client',
            'payments',
        ];

        // Only include master relation if user is admin/master
        if (user?.role_name === 'admin' || user?.role_name === 'master' || user?.role_name === 'operator') {
            relations.push('details.master');
        }

        const order = await this.orderRepo.findOne({
            where: { id },
            relations,
        });

        if (!order) throw new NotFoundException('Order not found');

        // Permission check - only allow owners or admins to view
        if (user?.role_name === 'client') {
            const client = await this.clientRepo.findOne({
                where: { user_id: user.id },
            });
            if (!client || client.id !== order.client_id) {
                throw new ForbiddenException('Access denied');
            }
        }

        return order;
    }

    // ===== ACCEPT ORDER =====
    async acceptOrder(id: string, userId: string, userRole: OrderRole) {
        // Route through the full state machine pipeline
        return this.updateOrder(id, { status: 'assigned' }, userId, userRole);
    }

    // ===== REJECT ORDER =====
    async rejectOrder(id: string, userId: string, userRole: OrderRole) {
        // Route through the full state machine pipeline with 'cancelled' status
        return this.updateOrder(id, { status: 'cancelled' }, userId, userRole);
    }

    // ===== SET PRICE FOR ORDER DETAILS =====
    async setPrice(
        id: string,
        details: { detail_id: string; price: number }[],
        userId: string,
    ) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        // Allow setting price right after assignment too (master can skip manual switch to diagnosing).
        if (!['assigned', 'diagnosing', 'awaiting_approval', 'approved'].includes(order.status)) {
            throw new BadRequestException('Prices can only be set for assigned, diagnosing, awaiting_approval, or approved orders');
        }

        const previousStatus = order.status;

        // Store old prices for history
        const oldPrices: Record<string, number> = {};

        // Update each detail
        for (const item of details) {
            const detail = await this.detailRepo.findOne({
                where: { id: item.detail_id, order_id: id },
            });
            if (!detail) throw new NotFoundException(`Detail ${item.detail_id} not found`);

            oldPrices[item.detail_id] = detail.price || 0;
            detail.price = item.price;
            await this.detailRepo.save(detail);

            // Add price history entry
            const priceHistory = this.priceHistoryRepo.create({
                order_id: id,
                order_detail_id: item.detail_id,
                old_price: Number(oldPrices[item.detail_id]),
                new_price: Number(item.price),
                changed_by: userId,
                reason: 'Price set/updated',
            });
            await this.priceHistoryRepo.save(priceHistory);
        }

        // Update order total
        const orderDetails = await this.detailRepo.find({ where: { order_id: id } });
        const newTotal = orderDetails.reduce((sum, d) => sum + Number(d.price || 0), 0);
        const oldTotal = Number(order.total_price_uzs || 0);
        order.total_price_uzs = newTotal;

        // Change status to awaiting_approval when price is newly set or changed
        let statusChanged = false;
        if (order.status === 'assigned' || order.status === 'diagnosing' || order.status === 'approved') {
            order.status = 'awaiting_approval';
            statusChanged = true;
        }

        await this.orderRepo.save(order);

        // Add lifecycle entry
        await this.addLifecycle(
            id,
            null,
            `Цена установлена: ${oldTotal} → ${newTotal} UZS`,
            1,
            userId,
            {
                actionType: 'price_set',
                metadata: {
                    old_value: oldTotal,
                    new_value: newTotal,
                    currency: 'UZS',
                },
            },
        );

        // Notify client that price is set and needs approval
        await this.notifyClient(order, 'price_set');

        // If status changed to awaiting_approval, log it
        if (statusChanged) {
            await this.auditService.logStatusChange(
                id,
                userId,
                previousStatus,
                'awaiting_approval',
                'Цена выставлена на согласование',
            );
            await this.notifyClientStatusChange(order, 'awaiting_approval');
        }

        return order;
    }

    // ===== APPROVE PRICE =====
    async approvePrice(id: string, userId: string) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        // Only orders with prices can be approved
        if (!order.total_price_uzs || order.total_price_uzs <= 0) {
            throw new BadRequestException('Order has no price to approve');
        }

        // Client can only approve from awaiting_approval status
        if (order.status !== 'awaiting_approval') {
            throw new BadRequestException('Order is not in awaiting_approval status');
        }

        const oldStatus = order.status;
        order.price_approved_at = new Date();
        order.price_approved_by = userId;
        order.status = 'approved'; // Change to approved status
        await this.orderRepo.save(order);

        // Add lifecycle entry
        await this.addLifecycle(id, null, 'Цена одобрена клиентом', 1, userId, { actionType: 'price_approved' });

        // Log status change
        await this.auditService.logStatusChange(id, userId, oldStatus, 'approved', 'Клиент одобрил цену');
        await this.notifyClientStatusChange(order, 'approved');

        // Notify admins/operators that price is approved and repair can start
        await this.notifyAdmins(id, 'price_approved', order.language);

        return order;
    }

    // ===== REJECT PRICE =====
    async rejectPrice(id: string, reason: string, userId: string) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        const oldStatus = order.status;
        order.price_rejected_at = new Date();
        order.price_rejected_by = userId;
        order.price_rejection_reason = reason;
        order.status = 'diagnosing';
        await this.orderRepo.save(order);

        // Add lifecycle entry
        await this.addLifecycle(id, null, `Цена отклонена: ${reason}`, 1, userId, {
            actionType: 'price_rejected',
            metadata: { reason },
        });

        await this.auditService.logStatusChange(id, userId, oldStatus, 'diagnosing', 'Клиент отклонил цену');
        await this.notifyClientStatusChange(order, 'diagnosing');

        // Notify admins/operators
        await this.notifyAdmins(id, 'price_rejected', order.language);

        return order;
    }

    // ===== ASSIGN MASTER TO ORDER DETAIL =====
    async assignMaster(
        orderId: string,
        detailId: string,
        masterId: string,
        userId: string,
    ) {
        const detail = await this.detailRepo.findOne({
            where: { id: detailId, order_id: orderId },
        });
        if (!detail) throw new NotFoundException('Order detail not found');

        detail.attached_to = masterId;
        detail.attached_at = new Date();
        detail.attached_by = userId;
        await this.detailRepo.save(detail);

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['details'],
        });
        if (order && order.status === 'new') {
            const hasAssignedMaster = order.details?.some((d) => !!d.attached_to);
            if (hasAssignedMaster) {
                const oldStatus = order.status;
                order.status = 'assigned';
                await this.orderRepo.save(order);
                await this.auditService.logStatusChange(orderId, userId, oldStatus, 'assigned', 'Мастер назначен');
                await this.notifyClientStatusChange(order, 'assigned');
            }
        }

        // Add lifecycle entry
        await this.addLifecycle(orderId, detailId, 'Мастер назначен', 1, userId, { actionType: 'master_assigned' });

        // Notify master
        await this.sendNotification(masterId, orderId, 'order_assigned', 'ru');

        return detail;
    }

    // ===== ASSIGN MASTER TO ENTIRE ORDER =====
    async assignMasterToOrder(orderId: string, masterId: string, userId: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        // Assign all details to master
        await this.detailRepo.update(
            { order_id: orderId },
            {
                attached_to: masterId,
                attached_at: new Date(),
                attached_by: userId,
            },
        );

        // Add lifecycle entry
        await this.addLifecycle(orderId, null, 'Мастер назначен на все работы', 1, userId, { actionType: 'master_assigned' });

        // Notify master
        await this.sendNotification(masterId, orderId, 'order_assigned', order.language);

        if (order.status === 'new') {
            const oldStatus = order.status;
            order.status = 'assigned';
            await this.orderRepo.save(order);
            await this.auditService.logStatusChange(orderId, userId, oldStatus, 'assigned', 'Мастер назначен на заказ');
            await this.notifyClientStatusChange(order, 'assigned');
        }

        return { success: true };
    }

    // ===== MASTER ACCEPTS ORDER DETAIL =====
    async acceptByMaster(orderId: string, detailId: string, masterId: string) {
        const detail = await this.detailRepo.findOne({
            where: { id: detailId, order_id: orderId, attached_to: masterId },
        });
        if (!detail) throw new NotFoundException('Order detail not found or not assigned to you');

        detail.master_accepted_at = new Date();
        await this.detailRepo.save(detail);

        // Add lifecycle entry
        await this.addLifecycle(orderId, detailId, 'Мастер принял работу', 1, masterId, { actionType: 'master_assigned' });

        return detail;
    }

    // ===== UPDATE PRICE FOR ORDER DETAIL =====
    async updatePrice(
        id: string,
        details: { detail_id: string; price: number }[],
        userId: string,
    ) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (!['diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup'].includes(order.status)) {
            throw new BadRequestException('Price can only be updated during diagnostics or active repair flow');
        }

        const previousStatus = order.status;
        const totalOldPrice = Number(order.total_price_uzs || 0);

        // Update each detail
        for (const item of details) {
            const detail = await this.detailRepo.findOne({
                where: { id: item.detail_id, order_id: id },
            });
            if (!detail) throw new NotFoundException(`Detail ${item.detail_id} not found`);

            // Store old price for history
            const oldPrice = detail.price;

            detail.price = item.price;
            await this.detailRepo.save(detail);

            // Add price history entry
            const priceHistory = this.priceHistoryRepo.create({
                order_id: id,
                order_detail_id: item.detail_id,
                old_price: Number(oldPrice),
                new_price: Number(item.price),
                changed_by: userId,
                reason: 'Price updated',
            });
            await this.priceHistoryRepo.save(priceHistory);
        }

        // Update order total
        const orderDetails = await this.detailRepo.find({ where: { order_id: id } });
        const newTotal = orderDetails.reduce((sum, d) => sum + Number(d.price || 0), 0);
        order.total_price_uzs = newTotal;

        // If price was changed after approval/start of repair, force re-approval by client.
        let statusChanged = false;
        if (['approved', 'in_repair', 'ready_for_pickup'].includes(order.status)) {
            order.status = 'awaiting_approval';
            order.price_approved_at = null;
            order.price_approved_by = null;
            statusChanged = true;
        }

        await this.orderRepo.save(order);

        // Add lifecycle entry
        await this.addLifecycle(id, null, `Цены обновлены для ${details.length} работ`, 1, userId, {
            actionType: 'price_updated',
            metadata: {
                old_value: totalOldPrice,
                new_value: newTotal,
                currency: 'UZS',
            },
        });

        if (statusChanged) {
            await this.auditService.logStatusChange(id, userId, previousStatus, 'awaiting_approval', 'Цена изменена после согласования');
            await this.notifyClientStatusChange(order, 'awaiting_approval');
        }

        // Notify client of price update
        await this.notifyClient(order, 'price_updated');

        return order;
    }

    // ===== COMPLETE ORDER DETAIL =====
    async completeDetail(
        orderId: string,
        detailId: string,
        isCompleted: number,
        comments: string | undefined,
        userId: string,
    ) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        // Logical guard: repair work can be completed only after price approval and repair start.
        if (Number(isCompleted) === 1) {
            if (!order.price_approved_at) {
                throw new BadRequestException('Нельзя завершить работу до одобрения цены клиентом');
            }
            if (!['in_repair'].includes(order.status)) {
                throw new BadRequestException('Нельзя завершить работу до начала ремонта (статус "В работе")');
            }
        }

        const detail = await this.detailRepo.findOne({
            where: { id: detailId, order_id: orderId },
        });
        if (!detail) throw new NotFoundException('Order detail not found');

        detail.is_completed = isCompleted;
        detail.completed_at = isCompleted ? new Date() : null;
        detail.completed_comments = comments || null;
        await this.detailRepo.save(detail);

        // Add lifecycle entry
        const action = isCompleted ? 'Работа выполнена' : 'Отметка выполнения снята';
        await this.addLifecycle(orderId, detailId, action, 1, userId, { actionType: 'item_completed' });

        return detail;
    }

    // ===== RETURN EQUIPMENT TO CLIENT =====
    async returnEquipment(orderId: string, detailId: string, userId: string) {
        const detail = await this.detailRepo.findOne({
            where: { id: detailId, order_id: orderId },
        });
        if (!detail) throw new NotFoundException('Order detail not found');

        detail.returned_at = new Date();
        detail.returned_by = userId;
        await this.detailRepo.save(detail);

        // Add lifecycle entry
        await this.addLifecycle(orderId, detailId, 'Оборудование возвращено клиенту', 1, userId, { actionType: 'order_closed' });

        return detail;
    }

    // ===== UPDATE TOTAL ORDER PRICE =====
    async updateTotalPrice(
        id: string,
        newPrice: number,
        reason: string | null,
        userId: string,
    ) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        const oldPrice = order.total_price_uzs;

        order.total_price_uzs = newPrice;
        order.price_last_updated = new Date();
        order.price_last_updated_by = userId;

        let statusChanged = false;
        if (['approved', 'in_repair', 'ready_for_pickup'].includes(order.status)) {
            order.status = 'awaiting_approval';
            order.price_approved_at = null;
            order.price_approved_by = null;
            statusChanged = true;
        }
        await this.orderRepo.save(order);

        // Add price history entry
        const priceHistory = this.priceHistoryRepo.create({
            order_id: order.id,
            old_price: oldPrice,
            new_price: newPrice,
            changed_by: userId,
            reason: reason || 'Manual price update',
        });
        await this.priceHistoryRepo.save(priceHistory);

        // Add lifecycle entry
        await this.addLifecycle(id, null, `Общая цена изменена: ${oldPrice} → ${newPrice}`, 1, userId, {
            actionType: 'price_updated',
            metadata: {
                old_value: oldPrice,
                new_value: newPrice,
                reason: reason || undefined,
                currency: 'UZS',
            },
        });

        // Notify client
        await this.notifyClient(order, 'price_updated');
        if (statusChanged) {
            await this.notifyClientStatusChange(order, 'awaiting_approval');
        }

        return order;
    }

    // ===== CLOSE ORDER =====
    async closeOrder(id: string, userId: string, userRole: OrderRole) {
        // Route through the full state machine pipeline — payment validation
        // is handled by the 'Оплата подтверждена' requirement in the state machine
        return this.updateOrder(id, { status: 'issued' }, userId, userRole);
    }

    // ===== UPDATE ORDER =====
    async updateOrder(id: string, dto: any, userId: string, userRole: OrderRole) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['details', 'client']
        });
        if (!order) throw new NotFoundException('Order not found');

        if (dto.status) {
            // No-op update should not create lifecycle/audit noise.
            if (dto.status === order.status) {
                return order;
            }

            // State machine validation
            const transition = canTransition(order.status as any, dto.status, userRole);

            if (!transition.allowed) {
                // Get allowed transitions for better error message
                const { STATE_TRANSITIONS } = await import('./order-state-machine');
                throw new ForbiddenException({
                    message: transition.reason || `Переход из статуса "${order.status}" в "${dto.status}" запрещён`,
                    allowedFrom: STATE_TRANSITIONS.filter(t => t.from === order.status).map(t => ({
                        to: t.to,
                        allowedRoles: t.allowedRoles,
                        description: t.description
                    }))
                });
            }

            // Gather requirements data
            // Bug #7 fix: details are guaranteed loaded via relations: ['details', 'client'] above
            const hasAssignedMaster = order.details && order.details.some(d => !!d.attached_to);
            const allDetailsCompleted = order.details && order.details.length > 0 && order.details.every(d => Number(d.is_completed) === 1);

            // Validate requirements
            const { STATE_TRANSITIONS } = await import('./order-state-machine');
            const exactTransition = STATE_TRANSITIONS.find(t => t.from === order.status && t.to === dto.status);

            const requirements = validateTransitionRequirements(
                exactTransition || { from: order.status as any, to: dto.status, allowedRoles: [], description: '' },
                {
                    has_assigned_master: hasAssignedMaster,
                    price_approved_at: order.price_approved_at,
                    total_price_uzs: order.total_price_uzs,
                    total_paid_uzs: order.total_paid_uzs,
                    all_details_completed: allDetailsCompleted,
                    parts_comment: dto.reason || null, // Bug #2 fix: pass reason as parts comment
                }
            );

            if (!requirements.valid) {
                throw new BadRequestException({
                    message: 'Требования перехода не выполнены',
                    missingRequirements: requirements.missingRequirements,
                });
            }

            // Use state machine service to transition status
            const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
            if (user) {
                const updatedOrder = await this.stateMachineService.transitionToStatus(order.id, dto.status, user, dto.reason);
                order.status = updatedOrder.status; // Update local object status to prevent overwrite by subsequent save
            } else {
                // Fallback to direct update if user not found
                order.status = dto.status;
            }

            // Trigger notification
            try {
                if (order.client?.user_id) {
                    await this.notificationsService.sendOrderStatusNotification(
                        id,
                        order.client.user_id,
                        dto.status,
                        order.language,
                    );
                }
            } catch (error) {
                console.error('Failed to send status notification:', error);
            }

            // Notify client about status change
            await this.notifyClient(order, 'order_status_changed');
        }

        if (dto.deadline) {
            order.deadline = new Date(dto.deadline);
        }

        await this.orderRepo.save(order);
        return order;
    }

    // ===== GET ORDER LIFECYCLE =====
    async getLifecycle(orderId: string, user: any) {
        // Verify user has access to this order
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        if (user?.role_name === 'client') {
            const client = await this.clientRepo.findOne({
                where: { user_id: user.id },
            });
            if (!client || client.id !== order.client_id) {
                throw new ForbiddenException('Access denied');
            }
        }

        const entries = await this.lifecycleRepo.find({
            where: { order_id: orderId },
            order: { created_at: 'ASC' },
            relations: ['creator'],
        });

        return entries;
    }

    // ===== ADD LIFECYCLE ENTRY =====
    async addLifecycleEntry(orderId: string, dto: any, userId: string | null) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');
        const inferredActionType = this.inferLifecycleActionType(dto.comments || '');

        // System/business events are written only by dedicated domain actions.
        const protectedActionTypes = new Set([
            'status_change',
            'item_completed',
            'price_set',
            'price_updated',
            'price_approved',
            'price_rejected',
            'master_assigned',
            'order_created',
            'order_closed',
        ]);
        if (protectedActionTypes.has(inferredActionType)) {
            throw new BadRequestException(
                'Нельзя вручную добавлять системные события. Используйте соответствующее действие в заказе.',
            );
        }

        const entry = this.lifecycleRepo.create({
            order_id: orderId,
            order_details_id: dto.order_details_id || dto.detail_id || null,
            comments: dto.comments,
            is_completed: dto.is_completed ?? 0,
            created_by: userId || '',
            action_type: 'note',
        });

        await this.lifecycleRepo.save(entry);
        return entry;
    }

    // Private helper to add lifecycle entries
    private async addLifecycle(
        orderId: string,
        detailId: string | null,
        comments: string,
        isCompleted: number,
        createdBy: string | null,
        options?: {
            actionType?: string;
            metadata?: Record<string, unknown>;
            fromStatus?: string | null;
            toStatus?: string | null;
            reason?: string;
        },
    ) {
        const actionType = options?.actionType || this.inferLifecycleActionType(comments);
        const entry = this.lifecycleRepo.create({
            order_id: orderId,
            order_details_id: detailId,
            comments,
            is_completed: isCompleted,
            created_by: createdBy || '',
            action_type: actionType,
            metadata: options?.metadata || null,
            actor_id: createdBy || null,
            from_status: options?.fromStatus || null,
            to_status: options?.toStatus || null,
            reason: options?.reason || comments,
        });
        await this.lifecycleRepo.save(entry);
    }

    private inferLifecycleActionType(comments: string): string {
        const text = comments.toLowerCase();

        if (text.includes('order created') || text.includes('заказ создан')) return 'order_created';
        if (text.includes('цена одобрена') || text.includes('price approved')) return 'price_approved';
        if (text.includes('цена отклонена') || text.includes('price rejected')) return 'price_rejected';
        if (text.includes('цена установлена') || text.includes('price set') || text.includes('prices updated')) return 'price_set';
        if (text.includes('total price updated') || text.includes('общая цена изменена')) return 'price_updated';
        if (text.includes('master assigned') || text.includes('мастер назначен')) return 'master_assigned';
        if (text.includes('item completed') || text.includes('работа выполн')) return 'item_completed';
        if (text.includes('status changed') || text.includes('статус измен')) return 'status_change';
        if (text.includes('note') || text.includes('заметка')) return 'note';

        return 'note';
    }

    // Private helper to send notifications
    private async sendNotification(
        userId: string,
        orderId: string,
        templateKey: string,
        language: string,
    ) {
        // In a real implementation, this would add to a queue
        // For now, we'll just log it
        console.log(`[NOTIFICATION] Would send ${templateKey} for order ${orderId} to user ${userId} in ${language}`);
    }

    // Private helper to notify client
    private async notifyClient(order: OrderEntity, templateKey: string) {
        if (!order.client_id) return;

        // Get client user ID
        const client = await this.clientRepo.findOne({ where: { id: order.client_id } });
        if (!client || !client.user_id) return;

        // Add notification to queue (non-blocking for business flow)
        try {
            await this.notifQueue.add('send-notification', {
                userId: client.user_id,
                orderId: order.id,
                templateKey,
                language: order.language,
            });
        } catch (error) {
            console.error('Failed to enqueue client notification:', error);
        }
    }

    // Private helper to notify admins
    private async notifyAdmins(orderId: string, templateKey: string, language: string) {
        // Get all admin users
        const admins = await this.userRepo.find({
            where: {
                role: {
                    name_eng: In(['admin', 'operator'])
                }
            }
        });

        // Add notification for each admin
        for (const admin of admins) {
            try {
                await this.notifQueue.add('send-notification', {
                    userId: admin.id,
                    orderId,
                    templateKey,
                    language,
                });
            } catch (error) {
                console.error(`Failed to enqueue admin notification for user ${admin.id}:`, error);
            }
        }
    }

    private async notifyClientStatusChange(order: OrderEntity, status: string) {
        if (!order?.client_id) return;

        const client = await this.clientRepo.findOne({ where: { id: order.client_id } });
        if (!client?.user_id) return;

        try {
            await this.notificationsService.sendOrderStatusNotification(
                order.id,
                client.user_id,
                status,
                order.language || 'ru',
            );
        } catch (error) {
            console.error('Failed to send direct client status notification:', error);
        }
    }

    // ===== GET STATS =====
    async getStats() {
        const totalOrders = await this.orderRepo.count();

        const activeRepairs = await this.orderRepo.count({
            where: {
                status: In(['new', 'assigned', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup', 'unrepairable'])
            }
        });

        // Completed today - use lifecycle to find transitions to 'ready_for_pickup' today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedToday = await this.lifecycleRepo.count({
            where: {
                to_status: 'ready_for_pickup',
                created_at: MoreThanOrEqual(today) as any
            }
        });

        // Total Revenue - Sum of all actual payments
        const revenueResult = await this.orderRepo
            .createQueryBuilder('order')
            .select('SUM(order.total_paid_uzs)', 'total')
            .getRawOne();

        // Compare today's new orders vs yesterday to get real trend
        const startToday = new Date();
        startToday.setHours(0, 0, 0, 0);

        const startYesterday = new Date(startToday);
        startYesterday.setDate(startYesterday.getDate() - 1);

        const ordersToday = await this.orderRepo
            .createQueryBuilder('order')
            .where('order.created_at >= :startToday', { startToday })
            .getCount();

        const ordersYesterday = await this.orderRepo
            .createQueryBuilder('order')
            .where('order.created_at >= :startYesterday', { startYesterday })
            .andWhere('order.created_at < :startToday', { startToday })
            .getCount();

        let ordersTrendPercent = 0;
        if (ordersYesterday === 0) {
            ordersTrendPercent = ordersToday === 0 ? 0 : 100;
        } else {
            ordersTrendPercent = Math.round(((ordersToday - ordersYesterday) / ordersYesterday) * 100);
        }

        return {
            totalOrders,
            activeRepairs,
            completedToday,
            totalRevenue: Number(revenueResult?.total || 0),
            ordersTrendPercent,
        };
    }

    // ===== FIND BY TRACKING TOKEN =====
    async findByTrackingToken(token: string) {
        const order = await this.orderRepo.findOne({
            where: { public_tracking_token: token },
            relations: [
                'details',
                'details.service',
                'details.equipment',
                'details.issue',
                'client',
            ],
        });

        if (!order) throw new NotFoundException('Order not found');

        return order;
    }

    // ===== GET PRICE HISTORY =====
    async getPriceHistory(orderId: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const history = await this.priceHistoryRepo.find({
            where: { order_id: orderId },
            order: { changed_at: 'DESC' },
            relations: ['user'],
        });

        return history;
    }
}
