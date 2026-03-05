import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderLifecycleEntity } from '../../database/entities';

export interface AuditAction {
    action_type: string;
    comments: string;
    comments_en?: string; // English translation
    comments_uz?: string; // Uzbek translation
    metadata?: {
        field_name?: string;
        old_value?: any;
        new_value?: any;
        reason?: string;
        [key: string]: any;
    };
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(OrderLifecycleEntity)
        private readonly lifecycleRepo: Repository<OrderLifecycleEntity>,
    ) {}

    /**
     * Логирование действия с заказом
     */
    async logAction(
        orderId: string,
        userId: string,
        action: AuditAction,
        detailId?: string | null,
    ): Promise<OrderLifecycleEntity> {
        const entry = this.lifecycleRepo.create({
            order_id: orderId,
            order_details_id: detailId || null,
            action_type: action.action_type,
            comments: action.comments,
            metadata: action.metadata || null,
            is_completed: 0,
            created_by: userId,
        });

        return this.lifecycleRepo.save(entry);
    }

    /**
     * Логирование изменения статуса
     */
    async logStatusChange(
        orderId: string,
        userId: string,
        oldStatus: string,
        newStatus: string,
        reason?: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'status_change',
            comments: `Статус изменён с "${oldStatus}" на "${newStatus}"`,
            comments_en: `Status changed from "${oldStatus}" to "${newStatus}"`,
            comments_uz: `Status "${oldStatus}" dan "${newStatus}" ga o'zgartirildi`,
            metadata: {
                field_name: 'status',
                old_value: oldStatus,
                new_value: newStatus,
                reason: reason || undefined,
            },
        });
    }

    /**
     * Логирование установки цены
     */
    async logPriceSet(
        orderId: string,
        userId: string,
        detailId: string,
        oldPrice: number,
        newPrice: number,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'price_set',
            comments: `Цена изменена с ${oldPrice} на ${newPrice} UZS`,
            comments_en: `Price changed from ${oldPrice} to ${newPrice} UZS`,
            comments_uz: `Narx ${oldPrice} dan ${newPrice} UZS ga o'zgartirildi`,
            metadata: {
                field_name: 'price',
                detail_id: detailId,
                old_value: oldPrice,
                new_value: newPrice,
                currency: 'UZS',
            },
        }, detailId);
    }

    /**
     * Логирование назначения мастера
     */
    async logMasterAssigned(
        orderId: string,
        userId: string,
        detailId: string,
        oldMasterId: string | null,
        newMasterId: string,
        masterName: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'master_assigned',
            comments: `Мастер назначен: ${masterName}`,
            comments_en: `Master assigned: ${masterName}`,
            comments_uz: `Usta tayinlandi: ${masterName}`,
            metadata: {
                field_name: 'attached_to',
                detail_id: detailId,
                old_value: oldMasterId,
                new_value: newMasterId,
                master_name: masterName,
            },
        }, detailId);
    }

    /**
     * Логирование согласования цены клиентом
     */
    async logPriceApproved(
        orderId: string,
        userId: string,
        detailId?: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'price_approved',
            comments: 'Цена одобрена клиентом',
            comments_en: 'Price approved by client',
            comments_uz: 'Narx mijoz tomonidan tasdiqlandi',
            metadata: {
                field_name: 'price_approved_at',
                old_value: null,
                new_value: new Date().toISOString(),
            },
        }, detailId);
    }

    /**
     * Логирование отклонения цены клиентом
     */
    async logPriceRejected(
        orderId: string,
        userId: string,
        reason: string,
        detailId?: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'price_rejected',
            comments: `Цена отклонена: ${reason}`,
            comments_en: `Price rejected: ${reason}`,
            comments_uz: `Narx rad etildi: ${reason}`,
            metadata: {
                field_name: 'price_rejected_at',
                reason: reason,
            },
        }, detailId);
    }

    /**
     * Логирование изменения общей цены заказа
     */
    async logPriceUpdated(
        orderId: string,
        userId: string,
        oldPrice: number,
        newPrice: number,
        reason: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'price_updated',
            comments: `Общая цена изменена: ${oldPrice} → ${newPrice} UZS (${reason})`,
            comments_en: `Total price updated: ${oldPrice} → ${newPrice} UZS (${reason})`,
            comments_uz: `Jami narx o'zgartirildi: ${oldPrice} → ${newPrice} UZS (${reason})`,
            metadata: {
                field_name: 'total_price_uzs',
                old_value: oldPrice,
                new_value: newPrice,
                reason: reason,
                currency: 'UZS',
            },
        });
    }

    /**
     * Логирование закрытия заказа
     */
    async logOrderClosed(
        orderId: string,
        userId: string,
        reason: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'order_closed',
            comments: `Заказ закрыт: ${reason}`,
            comments_en: `Order closed: ${reason}`,
            comments_uz: `Buyurtma yopildi: ${reason}`,
            metadata: {
                field_name: 'status',
                reason: reason,
            },
        });
    }

    /**
     * Логирование изменения срока
     */
    async logDeadlineChanged(
        orderId: string,
        userId: string,
        oldDeadline: Date | null,
        newDeadline: Date,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'deadline_changed',
            comments: `Срок изменён с ${oldDeadline?.toLocaleDateString('ru-RU') || 'не указан'} на ${newDeadline.toLocaleDateString('ru-RU')}`,
            comments_en: `Deadline changed from ${oldDeadline?.toLocaleDateString('en-US') || 'not set'} to ${newDeadline.toLocaleDateString('en-US')}`,
            comments_uz: `Muddat ${oldDeadline?.toLocaleDateString('ru-RU') || 'belgilanmagan'} dan ${newDeadline.toLocaleDateString('ru-RU')} ga o'zgartirildi`,
            metadata: {
                field_name: 'deadline',
                old_value: oldDeadline?.toISOString(),
                new_value: newDeadline.toISOString(),
            },
        });
    }

    /**
     * Логирование создания заказа
     */
    async logOrderCreated(
        orderId: string,
        userId: string,
    ): Promise<OrderLifecycleEntity> {
        return this.logAction(orderId, userId, {
            action_type: 'order_created',
            comments: 'Заказ создан',
            comments_en: 'Order created',
            comments_uz: 'Buyurtma yaratildi',
            metadata: {
                field_name: 'order',
                old_value: null,
                new_value: 'created',
            },
        });
    }

    /**
     * Получить историю аудита для заказа
     */
    async getOrderHistory(orderId: string): Promise<OrderLifecycleEntity[]> {
        return this.lifecycleRepo.find({
            where: { order_id: orderId },
            relations: ['creator'],
            order: { created_at: 'ASC' },
        });
    }

    /**
     * Получить историю по типу действия
     */
    async getActionsByType(
        orderId: string,
        actionType: string,
    ): Promise<OrderLifecycleEntity[]> {
        return this.lifecycleRepo.find({
            where: {
                order_id: orderId,
                action_type: actionType,
            },
            relations: ['creator'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Получить последнее действие
     */
    async getLastAction(orderId: string): Promise<OrderLifecycleEntity | null> {
        return this.lifecycleRepo.findOne({
            where: { order_id: orderId },
            relations: ['creator'],
            order: { created_at: 'DESC' },
        });
    }
}
