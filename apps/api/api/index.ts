import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { AppModule } from '../src/app.module';
import { createLogger } from '../src/common/logger/pino.logger';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { migrateLegacyUploads } from '../src/common/utils/uploads-path';

let cachedApp: any = null;

async function createApp() {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter, {
        logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });

    const configService = app.get(ConfigService);

    // Глобальный фильтр исключений
    app.useGlobalFilters(new AllExceptionsFilter());

    // Cookie parsing
    app.use(cookieParser());

    // Security
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
                scriptSrc: [`'self'`, `'unsafe-inline'`],
            },
        },
    }));

    app.use(compression());

    // CORS
    const webUrl = configService.get('WEB_URL', 'http://localhost:3003');
    app.enableCors({
        origin: [webUrl, 'http://localhost:3003', 'http://127.0.0.1:3003'],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization',
        exposedHeaders: 'Set-Cookie',
    });

    // Global prefix
    app.setGlobalPrefix('v1', { exclude: ['/'] });

    // Skip file operations in serverless
    migrateLegacyUploads();

    // Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('HDD Fixer Service Center API')
        .setDescription('API for equipment repair order management')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    return expressApp;
}

export default async (req: VercelRequest, res: VercelResponse) => {
    if (!cachedApp) {
        cachedApp = await createApp();
    }
    cachedApp(req, res);
};
