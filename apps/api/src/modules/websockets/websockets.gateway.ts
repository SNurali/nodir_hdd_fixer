import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(private readonly ordersService: OrdersService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedClients.set(client.id, userId);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_order_room')
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order_${orderId}`);
    this.logger.log(`Client ${client.id} joined room order_${orderId}`);
  }

  @SubscribeMessage('leave_order_room')
  handleLeaveOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.leave(`order_${orderId}`);
    this.logger.log(`Client ${client.id} left room order_${orderId}`);
  }

  // Emit order update to all clients in the order room
  async emitOrderUpdate(orderId: string, data: any) {
    this.server.to(`order_${orderId}`).emit('order_update', {
      orderId,
      ...data,
    });
  }

  // Emit notification to specific user
  async emitUserNotification(userId: string, data: any) {
    // Find all sockets for this user
    for (const [socketId, uid] of this.connectedClients.entries()) {
      if (uid === userId) {
        this.server.to(socketId).emit('notification', data);
      }
    }
  }
}