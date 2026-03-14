import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { existsSync, mkdirSync } from 'fs';

import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createLogger } from './common/logger/pino.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { getUploadsDir, migrateLegacyUploads, isServerless } from './common/utils/uploads-path';

async function bootstrap() {
    const logger = createLogger('NestApplication');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });
    const configService = app.get(ConfigService);

    // Глобальный фильтр исключений
    app.useGlobalFilters(new AllExceptionsFilter());

    // Cookie parsing
    app.use(cookieParser());

    // Security
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
                scriptSrc: [`'self'`, `https:'unsafe-inline'`],
            },
        },
    }));
    app.use(compression());

    // CORS - разрешаем все домены
    const corsOrigins = [
        'http://arendator.uz:3003',
        'http://hddfix.uz:3003',
        'http://localhost:3003',
        'http://127.0.0.1:3003',
        'http://arendator.uz',
        'http://hddfix.uz',
        'https://arendator.uz',
        'https://hddfix.uz',
        /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}:3003/,  // Любые IP на порту 3003
        true, // Разрешить все origin (для отладки)
    ];

    app.enableCors({
        origin: function (origin, callback) {
            // Разрешаем запросы без origin (mobile apps, curl)
            if (!origin) return callback(null, true);
            
            const allowed = corsOrigins.some(o => {
                if (o === true) return true;
                if (o instanceof RegExp) return o.test(origin);
                return o === origin;
            });
            callback(null, allowed);
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
        exposedHeaders: 'Set-Cookie',
    });

    // Global prefix
    app.setGlobalPrefix('v1', { exclude: ['/'] });

    const uploadsDir = getUploadsDir();
    migrateLegacyUploads();
    
    // In serverless environments, the filesystem is read-only, so we skip static assets
    if (!isServerless()) {
        if (!existsSync(uploadsDir)) {
            try {
                mkdirSync(uploadsDir, { recursive: true });
            } catch (error) {
                console.warn('Failed to create uploads directory:', error);
            }
        }
        app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
    }

    // Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('HDD Fixer Service Center API')
        .setDescription('API for equipment repair order management')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get('APP_PORT', 3004);
    await app.listen(port, '0.0.0.0');
    logger.log(`API running on http://0.0.0.0:${port}`);
    logger.log(`CORS enabled for: arendator.uz:3003, hddfix.uz:3003, localhost:3003`);
    logger.log(`Uploads dir: ${uploadsDir}`);
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

// Обработка незавершенных обещаний
process.on('unhandledRejection', (reason, promise) => {
    const logger = createLogger('UnhandledRejection');
    logger.error('Unhandled Rejection at:', { promise, reason });
});

// Обработка неперехваченных исключений
process.on('uncaughtException', (error) => {
    const logger = createLogger('UncaughtException');
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});

bootstrap().catch(err => {
    const logger = createLogger('Bootstrap');
    logger.error('Failed to start application', { 
        error: err,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        code: (err as any)?.code,
        syscall: (err as any)?.syscall,
        address: (err as any)?.address,
        port: (err as any)?.port,
    });
    console.error('FULL ERROR:', err);
    process.exit(1);
});
