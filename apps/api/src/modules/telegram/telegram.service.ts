import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderDetailEntity, ClientEntity, UserEntity } from '../../database/entities';

export interface OrderNotificationPayload {
    orderId: string;
    status?: string;
    clientName?: string;
    clientPhone?: string;
    totalPrice?: number;
    masterName?: string;
    price?: number;
    reason?: string;
    actionType?: string;
    details?: string;
}

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string | null;
    private readonly chatId: string | null;
    private readonly apiUrl: string;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectRepository(OrderDetailEntity)
        private readonly detailRepo: Repository<OrderDetailEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || null;
        this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || null;
        this.apiUrl = this.botToken ? `https://api.telegram.org/bot${this.botToken}` : '';
    }

    private isConfigured(): boolean {
        return !!(this.botToken && this.chatId);
    }

    async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
        if (!this.isConfigured()) {
            this.logger.warn('Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text,
                    parse_mode: parseMode,
                    disable_web_page_preview: true,
                }),
            });

            const data = await response.json() as { ok: boolean; description?: string };

            if (!data.ok) {
                this.logger.error(`Telegram API error: ${data.description}`);
                return false;
            }

            this.logger.log('Message sent to Telegram group');
            return true;
        } catch (error) {
            this.logger.error('Failed to send Telegram message', error);
            return false;
        }
    }

    // ===== ORDER NOTIFICATIONS =====

    async notifyNewOrder(orderId: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client', 'details', 'details.service', 'details.equipment'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();
        const client = order.client;
        const details = order.details || [];

        let detailsText = '';
        for (const detail of details) {
            const equipment = detail.equipment;
            const service = detail.service;
            detailsText += `\n  • ${equipment?.name_rus || 'Оборудование'} - ${service?.name_rus || 'Услуга'}`;
            if (detail.description_of_issue) {
                detailsText += ` (${detail.description_of_issue.slice(0, 50)}${detail.description_of_issue.length > 50 ? '...' : ''})`;
            }
        }

        const text = `
🆕 <b>НОВЫЙ ЗАКАЗ</b> #${orderShortId}

👤 <b>Клиент:</b> ${client?.full_name || 'Не указан'}
📱 <b>Телефон:</b> ${client?.phone || 'Не указан'}
${client?.telegram ? `💬 <b>Telegram:</b> @${client.telegram.replace('@', '')}` : ''}

📦 <b>Оборудование:</b>${detailsText || '\n  Не указано'}

💰 <b>Сумма:</b> ${Number(order.total_price_uzs || 0).toLocaleString('ru-RU')} UZS
📅 <b>Дата:</b> ${new Date(order.created_at).toLocaleString('ru-RU')}

⚠️ <b>Требуется назначение мастера!</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyOrderStatusChange(
        orderId: string,
        fromStatus: string,
        toStatus: string,
        actorName?: string,
        reason?: string,
    ): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();
        const statusEmoji = this.getStatusEmoji(toStatus);
        const statusLabel = this.getStatusLabel(toStatus);

        const text = `
${statusEmoji} <b>СТАТУС ИЗМЕНЁН</b> #${orderShortId}

📋 ${this.getStatusLabel(fromStatus)} → ${statusLabel}
👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
${actorName ? `🔧 <b>Изменил:</b> ${actorName}` : ''}
${reason ? `📝 <b>Причина:</b> ${reason}` : ''}
`.trim();

        await this.sendMessage(text);
    }

    async notifyPriceSet(orderId: string, price: number, masterName?: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
💰 <b>ЦЕНА УСТАНОВЛЕНА</b> #${orderShortId}

💵 <b>Сумма:</b> ${price.toLocaleString('ru-RU')} UZS
👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
${masterName ? `🔧 <b>Мастер:</b> ${masterName}` : ''}

⏳ <b>Ожидает согласования клиента</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyPriceApproved(orderId: string, clientName?: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
✅ <b>ЦЕНА ОДОБРЕНА</b> #${orderShortId}

💵 <b>Сумма:</b> ${Number(order.total_price_uzs || 0).toLocaleString('ru-RU')} UZS
👤 <b>Клиент:</b> ${clientName || order.client?.full_name || 'Не указан'}

🚀 <b>Можно начинать ремонт!</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyPriceRejected(orderId: string, reason: string, clientName?: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
❌ <b>ЦЕНА ОТКЛОНЕНА</b> #${orderShortId}

👤 <b>Клиент:</b> ${clientName || order.client?.full_name || 'Не указан'}
📝 <b>Причина:</b> ${reason}

🔄 <b>Требуется пересмотр цены</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyMasterAssigned(orderId: string, masterId: string): Promise<void> {
        if (!this.isConfigured()) return;

        const [order, master] = await Promise.all([
            this.orderRepo.findOne({
                where: { id: orderId },
                relations: ['client'],
            }),
            this.userRepo.findOne({ where: { id: masterId } }),
        ]);

        if (!order || !master) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
👨‍🔧 <b>МАСТЕР НАЗНАЧЕН</b> #${orderShortId}

👤 <b>Мастер:</b> ${master.full_name}
📱 <b>Телефон:</b> ${master.phone || 'Не указан'}
📋 <b>Заказ:</b> ${order.client?.full_name || 'Не указан'}
`.trim();

        await this.sendMessage(text);
    }

    async notifyPaymentReceived(orderId: string, amount: number, currency: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();
        const currencySymbol = currency === 'UZS' ? 'сум' : currency;

        const text = `
💳 <b>ОПЛАТА ПОЛУЧЕНА</b> #${orderShortId}

💵 <b>Сумма:</b> ${amount.toLocaleString('ru-RU')} ${currencySymbol}
👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
💰 <b>Оплачено всего:</b> ${Number(order.total_paid_uzs || 0).toLocaleString('ru-RU')} UZS
`.trim();

        await this.sendMessage(text);
    }

    async notifyOrderCompleted(orderId: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
🎉 <b>ЗАКАЗ ГОТОВ</b> #${orderShortId}

👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
📱 <b>Телефон:</b> ${order.client?.phone || 'Не указан'}
💰 <b>Сумма:</b> ${Number(order.total_price_uzs || 0).toLocaleString('ru-RU')} UZS

📞 <b>Свяжитесь с клиентом для выдачи!</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyOrderIssued(orderId: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
📦 <b>ЗАКАЗ ВЫДАН</b> #${orderShortId}

👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
💰 <b>Сумма:</b> ${Number(order.total_price_uzs || 0).toLocaleString('ru-RU')} UZS
💳 <b>Оплачено:</b> ${Number(order.total_paid_uzs || 0).toLocaleString('ru-RU')} UZS

✅ <b>Заказ закрыт!</b>
`.trim();

        await this.sendMessage(text);
    }

    async notifyOrderCancelled(orderId: string, reason?: string): Promise<void> {
        if (!this.isConfigured()) return;

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['client'],
        });

        if (!order) return;

        const orderShortId = orderId.slice(0, 8).toUpperCase();

        const text = `
🚫 <b>ЗАКАЗ ОТМЕНЁН</b> #${orderShortId}

👤 <b>Клиент:</b> ${order.client?.full_name || 'Не указан'}
${reason ? `📝 <b>Причина:</b> ${reason}` : ''}
`.trim();

        await this.sendMessage(text);
    }

    // ===== HELPERS =====

    private getStatusEmoji(status: string): string {
        const emojis: Record<string, string> = {
            new: '🆕',
            assigned: '👨‍🔧',
            diagnosing: '🔍',
            awaiting_approval: '⏳',
            approved: '✅',
            in_repair: '🔧',
            ready_for_pickup: '🎉',
            unrepairable: '⚠️',
            issued: '📦',
            cancelled: '🚫',
        };
        return emojis[status] || '📋';
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            new: 'Новый',
            assigned: 'Назначен',
            diagnosing: 'Диагностика',
            awaiting_approval: 'Ожидает согласования',
            approved: 'Одобрен',
            in_repair: 'В ремонте',
            ready_for_pickup: 'Готов к выдаче',
            unrepairable: 'Неремонтопригоден',
            issued: 'Выдан',
            cancelled: 'Отменён',
        };
        return labels[status] || status;
    }
}