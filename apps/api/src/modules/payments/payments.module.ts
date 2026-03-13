import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FinancialReportService } from './financial-report.service';
import { PaymentEntity, OrderEntity, UserEntity, NotificationEntity, ClientEntity } from '../../database/entities';
import { BullModule } from '@nestjs/bullmq';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PaymentEntity, OrderEntity, UserEntity, NotificationEntity, ClientEntity]),
        BullModule.registerQueue({ name: 'notifications' }),
        TelegramModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, FinancialReportService],
    exports: [PaymentsService, FinancialReportService],
})
export class PaymentsModule { }
