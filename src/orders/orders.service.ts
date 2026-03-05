import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany();
      return orders as Order[];
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Order | null> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      return order || null;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  async create(data: any): Promise<Order> {
    try {
      const order = await this.prisma.order.create({ data });
      return order as Order;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: number, data: any): Promise<Order> {
    try {
      const order = await this.prisma.order.update({ where: { id }, data });
      return order as Order;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async remove(id: number): Promise<Order> {
    try {
      const order = await this.prisma.order.delete({ where: { id } });
      return order as Order;
    } catch (error) {
      console.error('Error in remove:', error);
      throw error;
    }
  }
}