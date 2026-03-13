import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface ErrorLog {
    timestamp: string;
    level: 'error' | 'critical' | 'fatal';
    service: string;
    message: string;
    stack?: string;
    context?: string;
    pid?: number;
}

@Injectable()
export class SmartLoggingService {
    private readonly logger = new Logger(SmartLoggingService.name);
    private readonly errorHistory: ErrorLog[] = [];
    private readonly maxHistory = 100;
    private readonly logFilePath: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly telegramService: TelegramService,
    ) {
        this.logFilePath = this.configService.get<string>('LOG_FILE', '/var/log/nodir_hdd_fixer/app.log');
    }

    async logError(
        message: string,
        service: string,
        stack?: string,
        context?: string,
        level: 'error' | 'critical' | 'fatal' = 'error',
    ): Promise<void> {
        const errorLog: ErrorLog = {
            timestamp: new Date().toISOString(),
            level,
            service,
            message,
            stack,
            context,
            pid: process.pid,
        };

        // Add to history
        this.errorHistory.push(errorLog);
        if (this.errorHistory.length > this.maxHistory) {
            this.errorHistory.shift();
        }

        // Log to file
        await this.writeToFile(errorLog);

        // Send to Telegram if critical or fatal
        if (level === 'critical' || level === 'fatal') {
            await this.sendToTelegram(errorLog);
        }

        // Check if we need to restart service
        if (level === 'fatal') {
            await this.handleFatalError(errorLog);
        }
    }

    async logServiceDown(service: string): Promise<void> {
        const errorLog: ErrorLog = {
            timestamp: new Date().toISOString(),
            level: 'critical',
            service,
            message: `Service ${service} is down!`,
            pid: process.pid,
        };

        await this.sendToTelegram(errorLog);
        await this.attemptRestart(service);
    }

    getErrorHistory(limit: number = 20): ErrorLog[] {
        return this.errorHistory.slice(-limit);
    }

    getCriticalErrorsLast24h(): number {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.errorHistory.filter(
            err => new Date(err.timestamp) > oneDayAgo &&
                (err.level === 'critical' || err.level === 'fatal')
        ).length;
    }

    private async writeToFile(errorLog: ErrorLog): Promise<void> {
        try {
            const logLine = `${errorLog.timestamp} [${errorLog.level.toUpperCase()}] [${errorLog.service}] ${errorLog.message}\n`;
            await execAsync(`echo "${logLine}" >> ${this.logFilePath} 2>/dev/null || true`);
        } catch (error) {
            this.logger.warn('Failed to write to log file', error);
        }
    }

    private async sendToTelegram(errorLog: ErrorLog): Promise<void> {
        const emoji = {
            error: '⚠️',
            critical: '🔴',
            fatal: '☠️',
        }[errorLog.level];

        const message = `
${emoji} <b>ОШИБКА СЕРВЕРА</b>

📝 <b>Сообщение:</b> ${errorLog.message.slice(0, 200)}
🔧 <b>Сервис:</b> ${errorLog.service}
📊 <b>Уровень:</b> ${errorLog.level.toUpperCase()}
⏰ <b>Время:</b> ${new Date(errorLog.timestamp).toLocaleString('ru-RU')}
🆔 <b>PID:</b> ${errorLog.pid}
${errorLog.context ? `📍 <b>Контекст:</b> ${errorLog.context}` : ''}
${errorLog.stack ? `\n📋 <b>Стектрейс:</b>\n<code>${errorLog.stack.slice(0, 1000)}</code>` : ''}

⚠️ <b>Требуется внимание!</b>
`.trim();

        await this.telegramService.sendMessage(message);
    }

    private async handleFatalError(errorLog: ErrorLog): Promise<void> {
        this.logger.error('Fatal error detected, attempting recovery...', errorLog);

        // Send alert
        await this.sendToTelegram({
            ...errorLog,
            message: `FATAL ERROR! Auto-recovery initiated for ${errorLog.service}`,
        });

        // Attempt automatic recovery
        await this.attemptRestart(errorLog.service);
    }

    private async attemptRestart(service: string): Promise<void> {
        this.logger.log(`Attempting to restart ${service}...`);

        try {
            // Check if running in Docker
            const dockerCheck = await execAsync('docker ps --format "{{.Names}}" 2>/dev/null || echo ""');
            const isDocker = dockerCheck.stdout.includes('api');

            if (isDocker) {
                // Docker restart
                await execAsync('docker compose -f docker-compose.prod.yml restart api 2>/dev/null || true');
                this.logger.log('Docker container restart initiated');
            } else {
                // PM2 restart
                await execAsync('pm2 restart all 2>/dev/null || true');
                this.logger.log('PM2 restart initiated');
            }

            // Notify about restart
            await this.telegramService.sendMessage(`
🔄 <b>АВТО-ПЕРЕЗАПУСК</b>

🔧 <b>Сервис:</b> ${service}
⏰ <b>Время:</b> ${new Date().toISOString()}
✅ <b>Перезапуск инициирован!</b>
`.trim());

        } catch (error) {
            this.logger.error('Failed to restart service', error);
            await this.telegramService.sendMessage(`
❌ <b>ОШИБКА ВОССТАНОВЛЕНИЯ</b>

🔧 <b>Сервис:</b> ${service}
🔥 <b>Ошибка:</b> Не удалось выполнить авто-перезапуск
⚠️ <b>Требуется ручное вмешательство!</b>
`.trim());
        }
    }
}
