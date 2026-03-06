import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createLogger } from '../logger/pino.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = createLogger('AllExceptionsFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Внутренняя ошибка сервера';

        const errorResponse =
            typeof message === 'object'
                ? message as Record<string, any>
                : { message, error: 'Server Error' };

        const fullError = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            ...errorResponse,
        };

        // Логируем ошибку
        const logMessage = exception instanceof Error ? exception.message : 'Unknown error';
        const logStack = exception instanceof Error ? exception.stack : undefined;
        
        this.logger.error(`Exception: ${logMessage}`, {
            stack: logStack,
            path: request.url,
            method: request.method,
            statusCode: status,
        });

        // Если это API запрос - возвращаем JSON
        if (request.url.startsWith('/v1/') || request.url.startsWith('/api/')) {
            response.status(status).json(fullError);
        } else {
            // Для браузерных запросов - HTML страница с ошибкой
            response.status(status).type('text/html').send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ошибка ${status} - HDD Fixer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #e94560;
            font-size: 72px;
            font-weight: 700;
            margin-bottom: 10px;
            text-align: center;
        }
        h2 {
            color: #fff;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            color: #a0a0a0;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .error-details {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .error-details h3 {
            color: #e94560;
            font-size: 16px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .log-entry {
            background: rgba(0, 0, 0, 0.5);
            border-left: 3px solid #e94560;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #0f0;
            overflow-x: auto;
        }
        .log-label {
            color: #e94560;
            font-weight: bold;
            margin-right: 10px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #e94560 0%, #c23a51 100%);
            color: #fff;
            padding: 15px 40px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
            text-align: center;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(233, 69, 96, 0.4);
        }
        .btn-secondary {
            background: transparent;
            border: 2px solid rgba(255, 255, 255, 0.3);
            margin-top: 10px;
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 5px 20px rgba(255, 255, 255, 0.1);
        }
        .auto-reload {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .auto-reload span {
            color: #e94560;
            font-weight: bold;
        }
        .status-badge {
            display: inline-block;
            background: #e94560;
            color: #fff;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center;">
            <span class="status-badge">ERROR ${status}</span>
        </div>
        <h1>${status}</h1>
        <h2>${(errorResponse as any).message || 'Ошибка сервера'}</h2>
        <p>Произошла непредвиденная ошибка при обработке вашего запроса.</p>
        
        <div class="error-details">
            <h3>📋 Детали ошибки</h3>
            <div class="log-entry">
                <span class="log-label">[TIMESTAMP]</span>${new Date().toISOString()}
            </div>
            <div class="log-entry">
                <span class="log-label">[METHOD]</span>${request.method}
            </div>
            <div class="log-entry">
                <span class="log-label">[PATH]</span>${request.url}
            </div>
            ${(errorResponse as any).error ? `
            <div class="log-entry">
                <span class="log-label">[ERROR]</span>${(errorResponse as any).error}
            </div>
            ` : ''}
        </div>

        <a href="/" class="btn">🏠 На главную</a>
        <button class="btn btn-secondary" onclick="location.reload()">🔄 Перезагрузить страницу</button>
        
        <div class="auto-reload">
            Автоматическая перезагрузка через <span id="countdown">10</span> секунд...
        </div>
    </div>

    <script>
        let seconds = 10;
        const countdown = document.getElementById('countdown');
        const timer = setInterval(() => {
            seconds--;
            countdown.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(timer);
                location.reload();
            }
        }, 1000);
    </script>
</body>
</html>
            `);
        }
    }
}
