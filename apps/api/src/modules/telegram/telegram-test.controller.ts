import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram Test')
@Controller('telegram')
export class TelegramTestController {
    constructor(private readonly telegramService: TelegramService) {}

    @Post('test')
    @ApiOperation({ summary: 'Test Telegram bot' })
    async test(@Body() body: { message?: string }) {
        const message = body?.message || '🔧 Тестовое сообщение от HDD Fixer API';
        const success = await this.telegramService.sendMessage(message);
        return {
            success,
            message: success ? 'Сообщение отправлено!' : 'Не удалось отправить. Проверьте токен и Chat ID',
        };
    }
}
