import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('orders/:orderId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get()
    @ApiOperation({ summary: 'Get messages for order' })
    getOrderMessages(
        @Param('orderId') orderId: string,
        @CurrentUser() user: any,
    ) {
        return this.messagesService.getOrderMessages(orderId, user.id, user.role_name);
    }

    @Post()
    @ApiOperation({ summary: 'Send message to order' })
    sendMessage(
        @Param('orderId') orderId: string,
        @Body() dto: { text: string; recipient_id?: string },
        @CurrentUser('id') userId: string,
    ) {
        return this.messagesService.sendMessage(
            orderId,
            userId,
            dto.text,
            dto.recipient_id,
        );
    }

    @Get('participants')
    @ApiOperation({ summary: 'Get chat participants for order' })
    getParticipants(@Param('orderId') orderId: string) {
        return this.messagesService.getChatParticipants(orderId);
    }

    @Get('unread')
    @ApiOperation({ summary: 'Get unread messages count' })
    getUnreadCount(@CurrentUser('id') userId: string) {
        return this.messagesService.getUnreadCount(userId);
    }

    @Patch(':messageId/read')
    @ApiOperation({ summary: 'Mark message as read' })
    markAsRead(
        @Param('messageId') messageId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.messagesService.markAsRead(messageId, userId);
    }

    @Post('read-all')
    @ApiOperation({ summary: 'Mark all messages as read for order' })
    markAllAsRead(
        @Param('orderId') orderId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.messagesService.markAllAsRead(orderId, userId);
    }
}
