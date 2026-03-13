import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClientEntity, OrderEntity, UserEntity } from '../../database/entities';
import { createLogger } from '../../common/logger/pino.logger';
import { NotificationsService } from '../notifications/notifications.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class OrdersNotificationsService {
    private readonly logger = createLogger('OrdersNotificationsService');

    constructor(
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService,
        private readonly telegramService: TelegramService,
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

    // ===== TELEGRAM GROUP NOTIFICATIONS =====

    async notifyTelegramNewOrder(orderId: string) {
        try {
            await this.telegramService.notifyNewOrder(orderId);
        } catch (error) {
            this.logger.error('Failed to send Telegram new order notification', { orderId, error });
        }
    }

    async notifyTelegramStatusChange(
        orderId: string,
        fromStatus: string,
        toStatus: string,
        actorId?: string,
        reason?: string,
    ) {
        try {
            let actorName: string | undefined;
            if (actorId) {
                const actor = await this.userRepo.findOne({ where: { id: actorId } });
                actorName = actor?.full_name;
            }
            await this.telegramService.notifyOrderStatusChange(orderId, fromStatus, toStatus, actorName, reason);
        } catch (error) {
            this.logger.error('Failed to send Telegram status change notification', { orderId, error });
        }
    }

    async notifyTelegramPriceSet(orderId: string, price: number, masterId?: string) {
        try {
            let masterName: string | undefined;
            if (masterId) {
                const master = await this.userRepo.findOne({ where: { id: masterId } });
                masterName = master?.full_name;
            }
            await this.telegramService.notifyPriceSet(orderId, price, masterName);
        } catch (error) {
            this.logger.error('Failed to send Telegram price set notification', { orderId, error });
        }
    }

    async notifyTelegramPriceApproved(orderId: string, clientId?: string) {
        try {
            let clientName: string | undefined;
            if (clientId) {
                const client = await this.clientRepo.findOne({ where: { id: clientId } });
                clientName = client?.full_name;
            }
            await this.telegramService.notifyPriceApproved(orderId, clientName);
        } catch (error) {
            this.logger.error('Failed to send Telegram price approved notification', { orderId, error });
        }
    }

    async notifyTelegramPriceRejected(orderId: string, reason: string, clientId?: string) {
        try {
            let clientName: string | undefined;
            if (clientId) {
                const client = await this.clientRepo.findOne({ where: { id: clientId } });
                clientName = client?.full_name;
            }
            await this.telegramService.notifyPriceRejected(orderId, reason, clientName);
        } catch (error) {
            this.logger.error('Failed to send Telegram price rejected notification', { orderId, error });
        }
    }

    async notifyTelegramMasterAssigned(orderId: string, masterId: string) {
        try {
            await this.telegramService.notifyMasterAssigned(orderId, masterId);
        } catch (error) {
            this.logger.error('Failed to send Telegram master assigned notification', { orderId, masterId, error });
        }
    }

    async notifyTelegramPaymentReceived(orderId: string, amount: number, currency: string) {
        try {
            await this.telegramService.notifyPaymentReceived(orderId, amount, currency);
        } catch (error) {
            this.logger.error('Failed to send Telegram payment notification', { orderId, error });
        }
    }

    async notifyTelegramOrderCompleted(orderId: string) {
        try {
            await this.telegramService.notifyOrderCompleted(orderId);
        } catch (error) {
            this.logger.error('Failed to send Telegram order completed notification', { orderId, error });
        }
    }

    async notifyTelegramOrderIssued(orderId: string) {
        try {
            await this.telegramService.notifyOrderIssued(orderId);
        } catch (error) {
            this.logger.error('Failed to send Telegram order issued notification', { orderId, error });
        }
    }

    async notifyTelegramOrderCancelled(orderId: string, reason?: string) {
        try {
            await this.telegramService.notifyOrderCancelled(orderId, reason);
        } catch (error) {
            this.logger.error('Failed to send Telegram order cancelled notification', { orderId, error });
        }
    }
}
