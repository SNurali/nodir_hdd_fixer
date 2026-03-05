import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        ConfigModule,
        NotificationsModule,
        TypeOrmModule.forFeature([UserEntity, ClientEntity, RoleEntity]),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule { }
