import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './api-url';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      return;
    }

    this.disconnect();

    this.userId = userId;
    this.socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      query: { userId },
      withCredentials: true,
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinOrderRoom(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_order_room', orderId);
    }
  }

  leaveOrderRoom(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_order_room', orderId);
    }
  }

  onOrderUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('order_update', callback);
    }
  }

  offOrderUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('order_update', callback);
    }
  }

  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }
}

export const socketService = new SocketService();
