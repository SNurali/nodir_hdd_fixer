import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        NotificationsModule,
        TypeOrmModule.forFeature([UserEntity, ClientEntity, RoleEntity]),
    ],
    controllers: [AuthController],
    providers: [AuthService, GoogleStrategy],
    exports: [AuthService],
})
export class AuthModule { }
