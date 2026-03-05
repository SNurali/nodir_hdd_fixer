import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageEntity } from '../../database/entities/message.entity';
import { OrderEntity } from '../../database/entities/order.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ClientEntity } from '../../database/entities/client.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MessageEntity,
            OrderEntity,
            UserEntity,
            ClientEntity,
        ]),
    ],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule {}
