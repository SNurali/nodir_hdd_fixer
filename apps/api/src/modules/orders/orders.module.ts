import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StateMachineService } from './state-machine.service';
import { AuditService } from './audit.service';
import { SlaService } from './sla.service';
import {
    OrderEntity,
    OrderDetailEntity,
    OrderLifecycleEntity,
    OrderPriceHistoryEntity,
    ClientEntity,
    UserEntity,
    NotificationEntity,
} from '../../database/entities';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        NotificationsModule,
        TypeOrmModule.forFeature([
            OrderEntity,
            OrderDetailEntity,
            OrderLifecycleEntity,
            OrderPriceHistoryEntity,
            ClientEntity,
            UserEntity,
            NotificationEntity,
        ]),
        BullModule.registerQueue({ name: 'notifications' }),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, StateMachineService, AuditService, SlaService],
    exports: [OrdersService, StateMachineService, AuditService, SlaService],
})
export class OrdersModule { }
