import { Body, Controller, Get, Patch, Param, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const BroadcastMarketingDto = z.object({
    message: z.string().trim().min(1).max(500),
    language: z.enum(['ru', 'en', 'uz-cyr', 'uz-lat']).optional(),
    channels: z.array(z.enum(['in_app', 'email', 'sms', 'telegram', 'push'])).min(1).optional(),
});

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly service: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.getUserNotifications(
            userId,
            parseInt(page || '1', 10),
            parseInt(limit || '20', 10),
        );
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    unreadCount(@CurrentUser('id') userId: string) {
        return this.service.getUnreadCount(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.service.markAsRead(id, userId);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markReadAll(@CurrentUser('id') userId: string) {
        return this.service.markAllAsRead(userId);
    }

    @Post('broadcast-marketing')
    @Roles('admin')
    @UsePipes(new ZodValidationPipe(BroadcastMarketingDto))
    @ApiOperation({ summary: 'Send marketing broadcast to clients who opted in' })
    broadcastMarketing(@Body() dto: z.infer<typeof BroadcastMarketingDto>) {
        return this.service.sendMarketingBroadcast(dto.message, dto.language, dto.channels);
    }
}
