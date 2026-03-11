import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({})
export class AuthModule {
    static register(): DynamicModule {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const isGoogleConfigured = !!(googleClientId && googleClientSecret);

        if (!isGoogleConfigured) {
            console.warn('⚠️  Google Auth is DISABLED. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
        }

        const providers: any[] = [AuthService];
        
        if (isGoogleConfigured) {
            providers.push(GoogleStrategy);
        }

        return {
            module: AuthModule,
            imports: [
                ConfigModule,
                PassportModule.register({ defaultStrategy: 'jwt' }),
                NotificationsModule,
                TypeOrmModule.forFeature([UserEntity, ClientEntity, RoleEntity]),
            ],
            controllers: [AuthController],
            providers,
            exports: [AuthService],
        };
    }
}
