import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../../database/entities/message.entity';
import { OrderEntity } from '../../database/entities/order.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ClientEntity } from '../../database/entities/client.entity';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    constructor(
        @InjectRepository(MessageEntity)
        private readonly messageRepo: Repository<MessageEntity>,
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
    ) {}

    /**
     * Send a message
     */
    async sendMessage(
        orderId: string,
        senderId: string,
        text: string,
        recipientId?: string,
    ) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const sender = await this.userRepo.findOne({ where: { id: senderId } });
        if (!sender) {
            throw new NotFoundException('Sender not found');
        }

        if (!text || text.trim().length === 0) {
            throw new BadRequestException('Message text cannot be empty');
        }

        const message = this.messageRepo.create({
            order_id: orderId,
            sender_id: senderId,
            recipient_id: recipientId,
            text: text.trim(),
            is_read: false,
        });

        const saved = await this.messageRepo.save(message);
        
        this.logger.log(`Message sent: ${saved.id} for order ${orderId}`);
        
        return saved;
    }

    /**
     * Get messages for order
     */
    async getOrderMessages(orderId: string, userId: string, userRole: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Check access permissions
        if (userRole === 'client') {
            const client = await this.clientRepo.findOne({ where: { user_id: userId } });
            if (!client || order.client_id !== client.id) {
                throw new BadRequestException('Access denied');
            }
        }

        const messages = await this.messageRepo.find({
            where: { order_id: orderId },
            relations: ['sender', 'recipient'],
            order: { created_at: 'ASC' },
        });

        // Mark messages as read
        const unreadMessages = messages.filter(
            (msg) => msg.recipient_id === userId && !msg.is_read,
        );

        for (const msg of unreadMessages) {
            msg.is_read = true;
            msg.read_at = new Date();
        }

        if (unreadMessages.length > 0) {
            await this.messageRepo.save(unreadMessages);
        }

        return messages;
    }

    /**
     * Get unread messages count for user
     */
    async getUnreadCount(userId: string) {
        const count = await this.messageRepo.count({
            where: { recipient_id: userId, is_read: false },
        });
        return { count };
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId: string, userId: string) {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        
        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.recipient_id !== userId) {
            throw new BadRequestException('You can only mark your own messages as read');
        }

        message.is_read = true;
        message.read_at = new Date();
        
        await this.messageRepo.save(message);
        
        return { success: true };
    }

    /**
     * Mark all messages as read for order
     */
    async markAllAsRead(orderId: string, userId: string) {
        await this.messageRepo.update(
            { order_id: orderId, recipient_id: userId, is_read: false },
            { is_read: true, read_at: new Date() },
        );
        
        return { success: true };
    }

    /**
     * Send order status update message (automated)
     */
    async sendStatusUpdate(orderId: string, newStatus: string, language: string = 'ru') {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) return;

        const statusMessages: Record<string, Record<string, string>> = {
            new: {
                ru: 'Ваш заказ принят и ожидает обработки',
                en: 'Your order has been received and is awaiting processing',
                'uz-cyr': 'Буюртмангиз қабул қилинди ва кутишда',
                'uz-lat': 'Buyurtmangiz qabul qilindi va kutishda'
            },
            assigned: {
                ru: 'Мастер назначен на ваш заказ',
                en: 'A master has been assigned to your order',
                'uz-cyr': 'Буюртмангизга уста тайинланди',
                'uz-lat': 'Buyurtmangizga usta tayinlandi'
            },
            diagnosing: {
                ru: 'Ваш заказ на диагностике',
                en: 'Your order is under diagnostics',
                'uz-cyr': 'Буюртмангиз диагностикада',
                'uz-lat': 'Buyurtmangiz diagnostikada'
            },
            awaiting_approval: {
                ru: 'Цена выставлена. Подтвердите, пожалуйста, сумму ремонта',
                en: 'Price has been set. Please confirm the repair amount',
                'uz-cyr': 'Нарх белгиланди. Илтимос, таъмир суммасини тасдиқланг',
                'uz-lat': 'Narx belgilandi. Iltimos, ta\'mir summasini tasdiqlang'
            },
            in_repair: {
                ru: 'Ваш заказ в ремонте',
                en: 'Your order is in repair',
                'uz-cyr': 'Буюртмангиз таъмир жараёнида',
                'uz-lat': 'Buyurtmangiz ta\'mir jarayonida'
            },
            ready_for_pickup: {
                ru: 'Ваш заказ готов к выдаче',
                en: 'Your order is ready for pickup',
                'uz-cyr': 'Буюртмангиз топширишга тайёр',
                'uz-lat': 'Buyurtmangiz topshirishga tayyor'
            },
            issued: {
                ru: 'Ваш заказ выдан',
                en: 'Your order has been issued',
                'uz-cyr': 'Буюртмангиз берилди',
                'uz-lat': 'Buyurtmangiz berildi'
            }
        };

        const messageText = statusMessages[newStatus]?.[language] || `Статус заказа изменён на: ${newStatus}`;

        // Send automated message from system
        const message = this.messageRepo.create({
            order_id: orderId,
            sender_id: 'system',
            text: messageText,
            is_read: false,
            metadata: { type: 'status_update', status: newStatus },
        });

        await this.messageRepo.save(message);
        
        this.logger.log(`Status update message sent for order ${orderId}`);
        
        return message;
    }

    /**
     * Send price approval request message
     */
    async sendPriceRequest(orderId: string, price: number, language: string = 'ru') {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) return;

        const priceMessages: Record<string, string> = {
            ru: `Мастер установил цену за выполнение работ: ${price.toLocaleString()} UZS. Пожалуйста, одобрите цену в личном кабинете.`,
            en: `Master has set the price for the work: ${price.toLocaleString()} UZS. Please approve the price in your dashboard.`,
            'uz-cyr': `Уста иш нархини белгилади: ${price.toLocaleString()} сўм. Илтимос, нархни тасдиқланг.`,
            'uz-lat': `Usta ish narxini belgiladi: ${price.toLocaleString()} so'm. Iltimos, narxni tasdiqlang.`
        };

        const message = this.messageRepo.create({
            order_id: orderId,
            sender_id: 'system',
            text: priceMessages[language] || priceMessages.ru,
            is_read: false,
            metadata: { type: 'price_request', price },
        });

        await this.messageRepo.save(message);
        
        this.logger.log(`Price request message sent for order ${orderId}`);
        
        return message;
    }

    /**
     * Get chat participants for order
     */
    async getChatParticipants(orderId: string) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Get all messages for this order to find participants
        const messages = await this.messageRepo.find({
            where: { order_id: orderId },
            relations: ['sender'],
        });

        const participantIds = [...new Set(messages.map(m => m.sender_id))];
        const participants = await this.userRepo.findByIds(participantIds);

        return {
            order_id: orderId,
            client_id: order.client?.user_id,
            participants: participants.map(p => ({
                id: p.id,
                full_name: p.full_name,
                role: p.role?.name_eng || 'user',
            })),
        };
    }
}
