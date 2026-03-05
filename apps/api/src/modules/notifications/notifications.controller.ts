import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
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
}
