import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { NotificationEntity, UserEntity } from '../../database/entities';

// Import notification templates
import * as templates from '../../i18n/notification-templates.json';

@Processor('notifications')
@Injectable()
export class NotificationWorker extends WorkerHost {
    private readonly logger = new Logger(NotificationWorker.name);

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notifRepo: Repository<NotificationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) {
        super();
    }

    async process(job: Job<{ notificationId: string }>) {
        const { notificationId } = job.data;

        const notification = await this.notifRepo.findOne({
            where: { id: notificationId },
            relations: ['user', 'order'],
        });

        if (!notification) {
            this.logger.warn(`Notification ${notificationId} not found`);
            return;
        }

        try {
            const template = this.getTemplate(
                notification.template_key,
                notification.language,
            );
            const message = this.renderTemplate(template, notification.payload as Record<string, unknown>);

            // Send based on channel
            switch (notification.channel) {
                case 'push':
                    await this.sendPush(notification.user, message);
                    break;
                case 'sms':
                    await this.sendSms(notification.user, message);
                    break;
                case 'email':
                    await this.sendEmail(notification.user, message);
                    break;
            }

            // Mark as sent
            notification.status = 'sent';
            notification.sent_at = new Date();
            await this.notifRepo.save(notification);

            this.logger.log(
                `Notification ${notificationId} sent via ${notification.channel}`,
            );
        } catch (error) {
            notification.status = 'failed';
            await this.notifRepo.save(notification);
            this.logger.error(
                `Failed to send notification ${notificationId}:`,
                error,
            );
        }
    }

    private getTemplate(key: string, language: string): string {
        const langTemplates = (templates as any)[language] || (templates as any)['ru'];
        return langTemplates?.[key] || `Notification: ${key}`;
    }

    private renderTemplate(template: string, payload: Record<string, unknown>): string {
        let result = template;
        for (const [key, value] of Object.entries(payload)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return result;
    }

    private async sendPush(user: UserEntity, message: string): Promise<void> {
        // TODO: Integrate Firebase Cloud Messaging
        this.logger.log(`[PUSH] → ${user.full_name}: ${message}`);
    }

    private async sendSms(user: UserEntity, message: string): Promise<void> {
        // TODO: Integrate Eskiz.uz SMS Gateway
        this.logger.log(`[SMS] → ${user.phone}: ${message}`);
    }

    private async sendEmail(user: UserEntity, message: string): Promise<void> {
        // TODO: Integrate Nodemailer SMTP
        this.logger.log(`[EMAIL] → ${user.email}: ${message}`);
    }
}
