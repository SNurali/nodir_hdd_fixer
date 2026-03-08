import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { NotificationEntity } from '../../database/entities';
import { UserEntity } from '../../database/entities';
import { OrderEntity } from '../../database/entities';
import { ConfigService } from '@nestjs/config';
import {
    AppNotificationChannel,
    isChannelEnabled,
    isTemplateAllowed,
} from './notification-preferences';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notifRepo: Repository<NotificationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectQueue('notifications')
        private readonly notifQueue: Queue,
        private readonly configService: ConfigService,
    ) {}

    private isChannelEnabled(user: UserEntity, channel: AppNotificationChannel): boolean {
        return isChannelEnabled(user, channel);
    }

    private isTemplateAllowed(user: UserEntity, channel: AppNotificationChannel, templateKey: string): boolean {
        return isTemplateAllowed(user, channel, templateKey);
    }

    private resolveNotificationChannels(
        user: UserEntity,
        requestedChannels?: AppNotificationChannel[],
    ): AppNotificationChannel[] {
        if (requestedChannels && requestedChannels.length > 0) {
            return requestedChannels;
        }

        const channels: AppNotificationChannel[] = ['in_app'];

        if (user.email) channels.push('email');
        if (user.phone) channels.push('sms');
        if (user.telegram) channels.push('telegram');
        if (user.fcm_token) channels.push('push');

        return channels;
    }

    async queueTemplateNotificationToUser(
        userId: string,
        orderId: string | null,
        templateKey: string,
        language: string,
        payload: Record<string, unknown> = {},
        requestedChannels?: AppNotificationChannel[],
    ) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return { queued: 0, skipped: true };
        }

        const channels = this.resolveNotificationChannels(user, requestedChannels);
        let queued = 0;

        for (const channel of channels) {
            if (!this.isTemplateAllowed(user, channel, templateKey)) {
                continue;
            }

            const notification = this.notifRepo.create({
                user_id: user.id,
                order_id: orderId,
                channel,
                template_key: templateKey,
                language,
                payload,
                status: channel === 'in_app' ? 'sent' : 'pending',
                is_read: false,
                sent_at: channel === 'in_app' ? new Date() : null,
            } as NotificationEntity);

            const saved = await this.notifRepo.save(notification);
            queued += 1;

            if (channel !== 'in_app') {
                await this.notifQueue.add('send-notification', { notificationId: saved.id });
            }
        }

        return { queued, skipped: queued === 0 };
    }

    async sendMarketingBroadcast(
        message: string,
        language?: string,
        requestedChannels?: AppNotificationChannel[],
    ) {
        const recipients = await this.userRepo.find({
            where: {
                role: {
                    name_eng: 'client',
                },
            },
            relations: ['role'],
        });

        let queued = 0;
        let skipped = 0;

        for (const recipient of recipients) {
            const result = await this.queueTemplateNotificationToUser(
                recipient.id,
                null,
                'marketing_broadcast',
                language || recipient.preferred_language || 'ru',
                { message },
                requestedChannels,
            );

            if (result.skipped) {
                skipped += 1;
            } else {
                queued += result.queued;
            }
        }

        return {
            recipients: recipients.length,
            queued,
            skipped,
        };
    }

    async sendOrderStatusNotification(
        orderId: string,
        userId: string,
        newStatus: string,
        language: string = 'ru',
    ) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const order = await this.orderRepo.findOne({ 
            where: { id: orderId },
            relations: ['client'] 
        });

        if (!user || !order) {
            this.logger.error('User or Order not found for notification');
            return;
        }

        const statusLabels: Record<string, Record<string, string>> = {
            new: { ru: 'В ожидании', en: 'Pending', 'uz-cyr': 'Кутишда', 'uz-lat': 'Kutishda' },
            assigned: { ru: 'Назначен', en: 'Assigned', 'uz-cyr': 'Тайинланди', 'uz-lat': 'Tayinlandi' },
            diagnosing: { ru: 'Диагностика', en: 'Diagnosing', 'uz-cyr': 'Диагностика', 'uz-lat': 'Diagnostika' },
            awaiting_approval: { ru: 'Ждёт одобрения', en: 'Awaiting Approval', 'uz-cyr': 'Тасдиқ кутилмоқда', 'uz-lat': 'Tasdiq kutilmoqda' },
            approved: { ru: 'Одобрен', en: 'Approved', 'uz-cyr': 'Тасдиқланди', 'uz-lat': 'Tasdiqlandi' },
            in_repair: { ru: 'В ремонте', en: 'In Repair', 'uz-cyr': 'Таъмирда', 'uz-lat': 'Ta\'mirda' },
            ready_for_pickup: { ru: 'Готов к выдаче', en: 'Ready for Pickup', 'uz-cyr': 'Топширишга тайёр', 'uz-lat': 'Topshirishga tayyor' },
            unrepairable: { ru: 'Неремонтопригоден', en: 'Unrepairable', 'uz-cyr': 'Таъмирлаб бўлмайди', 'uz-lat': 'Ta\'mirlab bo\'lmaydi' },
            issued: { ru: 'Выдан', en: 'Issued', 'uz-cyr': 'Берилди', 'uz-lat': 'Berildi' },
            cancelled: { ru: 'Отменён', en: 'Cancelled', 'uz-cyr': 'Бекор қилинди', 'uz-lat': 'Bekor qilindi' },
        };

        const statusLabel = (statusLabels[newStatus] as any)?.[language] || newStatus;
        const orderShortId = orderId.slice(0, 8).toUpperCase();
        const title = language === 'ru' ? `Статус заказа #${orderShortId} изменён` :
            language === 'en' ? `Order status #${orderShortId} changed` :
            `Buyurtma holati #${orderShortId} o'zgardi`;
        const text = language === 'ru' ? `Ваш заказ перешёл в статус: ${statusLabel}` :
            language === 'en' ? `Your order has been updated to: ${statusLabel}` :
            `Sizning buyurtmangiz holati o'zgardi: ${statusLabel}`;

        // Email notification
        if (user.email && this.isChannelEnabled(user, 'email')) {
            await this.sendEmail(
                user.email,
                title,
                text,
                {
                    template: 'order-status-change',
                    data: { orderId: orderShortId, status: statusLabel, clientName: order.client?.full_name, language }
                }
            );
        }

        // SMS notification
        if (user.phone && this.isChannelEnabled(user, 'sms')) {
            await this.sendSMS(
                user.phone,
                `Заказ #${orderShortId}: ${statusLabel}`
            );
        }

        if (user.telegram && this.isChannelEnabled(user, 'telegram')) {
            await this.sendTelegram(user.telegram, text);
        }

        if (user.fcm_token && this.isChannelEnabled(user, 'push')) {
            await this.sendPush(user.fcm_token, title, text, {
                orderId: orderShortId,
                status: newStatus,
            });
        }

        // Create in-app notification
        await this.createInAppNotification(userId, orderId, 'status_change', {
            status: statusLabel,
            orderId: orderShortId
        }, language);

        this.logger.log(`Notification sent for order ${orderId} to user ${userId}`);
    }

    async sendPriceApprovalNotification(
        orderId: string,
        userId: string,
        price: number,
        language: string = 'ru',
    ) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();
        const priceFormatted = price.toLocaleString();

        const subjects: any = {
            ru: 'Цена за заказ установлена',
            en: 'Order price has been set',
            'uz-cyr': 'Буюртма нархи белгиланди',
            'uz-lat': 'Buyurtma narxi belgilandi'
        };

        const messages: any = {
            ru: `Мастер установил цену: ${priceFormatted} UZS. Пожалуйста, одобрите в личном кабинете.`,
            en: `Master set the price: ${priceFormatted} UZS. Please approve in your dashboard.`,
            'uz-cyr': `Уста нарх белгилади: ${priceFormatted} сўм. Илтимос, тасдиқланг.`,
            'uz-lat': `Usta narx belgiladi: ${priceFormatted} so'm. Iltimos, tasdiqlang.`
        };

        if (user.email && this.isChannelEnabled(user, 'email')) {
            await this.sendEmail(user.email, subjects[language] || subjects.ru, messages[language] || messages.ru, {
                template: 'price-approval',
                data: { orderId: orderShortId, price: priceFormatted, language }
            });
        }

        if (user.phone && this.isChannelEnabled(user, 'sms')) {
            await this.sendSMS(user.phone, `${subjects[language] || subjects.ru}: ${priceFormatted} UZS`);
        }

        if (user.telegram && this.isChannelEnabled(user, 'telegram')) {
            await this.sendTelegram(user.telegram, messages[language] || messages.ru);
        }

        if (user.fcm_token && this.isChannelEnabled(user, 'push')) {
            await this.sendPush(
                user.fcm_token,
                subjects[language] || subjects.ru,
                messages[language] || messages.ru,
                { orderId: orderShortId, price: priceFormatted },
            );
        }

        await this.createInAppNotification(userId, orderId, 'price_approval', {
            price: priceFormatted,
            orderId: orderShortId
        }, language);
    }

    async sendMasterAssignmentNotification(
        orderId: string,
        masterId: string,
        language: string = 'ru',
    ) {
        const master = await this.userRepo.findOne({ where: { id: masterId } });
        if (!master) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const subjects: any = {
            ru: 'Вам назначен новый заказ',
            en: 'New order assigned to you',
            'uz-cyr': 'Сизга янги буюртма тайинланди',
            'uz-lat': 'Sizga yangi buyurtma tayinlandi'
        };
        const text = language === 'en'
            ? `Order #${orderShortId} has been assigned to you. Please review it in your dashboard.`
            : language?.startsWith('uz')
                ? `#${orderShortId} buyurtma sizga tayinlandi. Iltimos, shaxsiy kabinetingizda tekshiring.`
                : `Заказ #${orderShortId} назначен вам. Пожалуйста, проверьте в личном кабинете.`;

        if (master.email && this.isChannelEnabled(master, 'email')) {
            await this.sendEmail(
                master.email,
                subjects[language] || subjects.ru,
                text,
                { template: 'master-assignment', data: { orderId: orderShortId, masterName: master.full_name, language } }
            );
        }

        if (master.phone && this.isChannelEnabled(master, 'sms')) {
            await this.sendSMS(master.phone, `${subjects[language]} #${orderShortId}`);
        }

        if (master.telegram && this.isChannelEnabled(master, 'telegram')) {
            await this.sendTelegram(master.telegram, text);
        }

        if (master.fcm_token && this.isChannelEnabled(master, 'push')) {
            await this.sendPush(master.fcm_token, subjects[language] || subjects.ru, text, {
                orderId: orderShortId,
            });
        }

        await this.createInAppNotification(masterId, orderId, 'master_assignment', {
            orderId: orderShortId
        }, language);
    }

    async sendEmail(to: string, subject: string, text: string, _options: { template?: string; data?: any } = {}) {
        // TODO: Integrate with SendGrid / SMTP
        this.logger.log(`📧 Email to ${to}: ${subject}`);
        
        // Create in-app notification as fallback
        return { success: true };
    }

    async sendSMS(phone: string, message: string) {
        // TODO: Integrate with SMS provider (Twilio, local SMS gateway)
        this.logger.log(`📱 SMS to ${phone}: ${message}`);
        return { success: true };
    }

    async sendPush(deviceToken: string, title: string, body: string, _data: any = {}) {
        // TODO: Integrate with Firebase FCM
        this.logger.log(`🔔 Push: ${title} - ${body}`);
        return { success: true };
    }

    async sendTelegram(chatId: string, message: string) {
        // TODO: Integrate with Telegram Bot API
        this.logger.log(`💬 Telegram to ${chatId}: ${message}`);
        return { success: true };
    }

    private async createInAppNotification(
        userId: string,
        orderId: string,
        type: string,
        data: any,
        language: string,
    ) {
        const notification = this.notifRepo.create({
            user_id: userId,
            order_id: orderId,
            channel: 'in_app',
            template_key: type,
            language,
            payload: data,
            status: 'sent',
            is_read: false,
            sent_at: new Date(),
        } as any);

        await this.notifRepo.save(notification);
    }

    async getUserNotifications(userId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.notifRepo.findAndCount({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });
        return { data, meta: { total, page, limit } };
    }

    async getUnreadCount(userId: string) {
        const count = await this.notifRepo.count({
            where: { user_id: userId, is_read: false },
        });
        return { count };
    }

    async markAsRead(id: string, userId: string) {
        await this.notifRepo.update({ id, user_id: userId }, { is_read: true });
        return { success: true };
    }

    async markAllAsRead(userId: string) {
        await this.notifRepo.update({ user_id: userId, is_read: false }, { is_read: true });
        return { success: true };
    }
}
