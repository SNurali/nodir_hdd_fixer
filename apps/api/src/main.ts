import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { existsSync, mkdirSync } from 'fs';

import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createLogger } from './common/logger/pino.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { getUploadsDir, migrateLegacyUploads } from './common/utils/uploads-path';

// Serverless detection: Vercel, AWS Lambda, etc.
function isServerless(): boolean {
    return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.CF_PAGES;
}

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

    // CORS
    const webUrl = configService.get('WEB_URL', 'http://localhost:3003');
    app.enableCors({
        origin: [
            webUrl,
            'http://localhost:3003',
            'http://127.0.0.1:3003',
        ],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization',
        exposedHeaders: 'Set-Cookie',
    });

    // Global prefix
    app.setGlobalPrefix('v1', { exclude: ['/'] });

    const uploadsDir = getUploadsDir();
    migrateLegacyUploads();
    
    // In serverless environments, the filesystem is read-only, so we skip static assets
    if (!isServerless()) {
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
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
    await app.listen(port);
    logger.log(`API running on http://localhost:${port}`);
    logger.log(`Allowed CORS origin: ${webUrl}`);
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
    logger.error('Failed to start application', { error: err });
    process.exit(1);
});
