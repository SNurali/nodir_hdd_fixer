import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';
import { ServicesModule } from './modules/services/services.module';
import { IssuesModule } from './modules/issues/issues.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { HealthModule } from './modules/health/health.module';
import { WebsocketsModule } from './modules/websockets/websockets.module';
import { throttlerConfig } from './common/throttler/throttler.config';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
        }),

        // Rate Limiting
        ThrottlerModule.forRoot(throttlerConfig),

        // Database
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get('DB_USERNAME', 'hdd_fixer'),
                password: config.get('DB_PASSWORD', 'hdd_fixer_secret'),
                database: config.get('DB_DATABASE', 'hdd_fixer_db'),
                entities: [__dirname + '/database/entities/*.entity{.ts,.js}'],
                migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                synchronize: false,
                logging: config.get('NODE_ENV') === 'development',
            }),
        }),

        // Queue (BullMQ)
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                },
            }),
        }),

        // Feature Modules
        AuthModule,
        UsersModule,
        RolesModule,
        ClientsModule,
        EquipmentsModule,
        ServicesModule,
        IssuesModule,
        OrdersModule,
        PaymentsModule,
        NotificationsModule,
        MessagesModule,
        HealthModule,
        WebsocketsModule,
    ],
})
export class AppModule { }
