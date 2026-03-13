import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity, OrderDetailEntity, ClientEntity, UserEntity } from '../../database/entities';
import { TelegramService } from './telegram.service';
import { TelegramTestController } from './telegram-test.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrderEntity,
            OrderDetailEntity,
            ClientEntity,
            UserEntity,
        ]),
    ],
    controllers: [TelegramTestController],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule {}