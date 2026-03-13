import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersNotificationsService } from './orders-notifications.service';
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
} from '../../database/entities';

import { NotificationsModule } from '../notifications/notifications.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
    imports: [
        NotificationsModule,
        TelegramModule,
        TypeOrmModule.forFeature([
            OrderEntity,
            OrderDetailEntity,
            OrderLifecycleEntity,
            OrderPriceHistoryEntity,
            ClientEntity,
            UserEntity,
        ]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersNotificationsService, StateMachineService, AuditService, SlaService],
    exports: [OrdersService, OrdersNotificationsService, StateMachineService, AuditService, SlaService],
})
export class OrdersModule { }
