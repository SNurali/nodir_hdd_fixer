import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClientEntity, OrderEntity, UserEntity } from '../../database/entities';
import { createLogger } from '../../common/logger/pino.logger';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersNotificationsService {
    private readonly logger = createLogger('OrdersNotificationsService');

    constructor(
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async queueTemplateToUser(userId: string, orderId: string, templateKey: string, language: string) {
        try {
            await this.notificationsService.queueTemplateNotificationToUser(
                userId,
                orderId,
                templateKey,
                language,
            );
        } catch (error) {
            this.logger.error('Failed to enqueue notification', { userId, orderId, templateKey, language, error });
        }
    }

    async notifyClient(order: Pick<OrderEntity, 'id' | 'client_id' | 'language'>, templateKey: string) {
        if (!order.client_id) return;

        const client = await this.clientRepo.findOne({ where: { id: order.client_id } });
        if (!client?.user_id) return;

        await this.queueTemplateToUser(client.user_id, order.id, templateKey, order.language);
    }

    async notifyAdmins(orderId: string, templateKey: string, language: string) {
        const admins = await this.userRepo.find({
            where: {
                role: {
                    name_eng: In(['admin', 'operator']),
                },
            },
        });

        for (const admin of admins) {
            await this.queueTemplateToUser(admin.id, orderId, templateKey, language);
        }
    }

    async notifyClientStatusChange(order: Pick<OrderEntity, 'id' | 'client_id' | 'language'>, status: string) {
        if (!order.client_id) return;

        const client = await this.clientRepo.findOne({ where: { id: order.client_id } });
        if (!client?.user_id) return;

        await this.notifyClientStatusChangeByUserId(order.id, client.user_id, status, order.language || 'ru');
    }

    async notifyClientStatusChangeByUserId(orderId: string, clientUserId: string, status: string, language: string) {
        try {
            await this.notificationsService.sendOrderStatusNotification(
                orderId,
                clientUserId,
                status,
                language,
            );
        } catch (error) {
            this.logger.error('Failed to send direct client status notification', {
                orderId,
                clientUserId,
                status,
                language,
                error,
            });
        }
    }
}
