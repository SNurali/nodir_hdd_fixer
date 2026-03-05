import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationWorker } from './notification.worker';
import { NotificationEntity, UserEntity, OrderEntity } from '../../database/entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationEntity, UserEntity, OrderEntity]),
        BullModule.registerQueue({ name: 'notifications' }),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationWorker],
    exports: [NotificationsService],
})
export class NotificationsModule { }
