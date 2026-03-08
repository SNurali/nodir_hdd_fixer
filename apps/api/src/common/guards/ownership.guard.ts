import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../database/entities/order.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ClientEntity } from '../../database/entities/client.entity';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepo: Repository<OrderEntity>,
    @InjectRepository(ClientEntity)
    private clientRepo: Repository<ClientEntity>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;
    const params = request.params;
    const orderId = params.id || params.orderId;

    if (!user || !orderId) {
      return false;
    }

    // Get role name from either role_name (from JWT) or role.name_eng (from DB)
    // Use 'any' type to avoid strict typing issues since user can come from different sources
    const typedUser = user as UserEntity & { role_name?: string };
    const roleName = typedUser.role_name || typedUser.role?.name_eng;

    // Allow admin, operator to access any order
    if (['admin', 'operator'].includes(roleName)) {
      return true;
    }

    // For master, check if they are assigned to any detail of this order
    if (roleName === 'master') {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['details'],
      });
      if (!order) return false;
      return order.details.some(detail => detail.attached_to === user.id);
    }

    // For client role, verify ownership
    if (roleName === 'client') {
      // Get the client profile linked to this user
      const client = await this.clientRepo.findOne({
        where: { user_id: user.id },
      });

      if (!client) {
        return false; // Client profile not found
      }

      // Check if the order belongs to this client
      const order = await this.orderRepo.findOne({
        where: { id: orderId, client_id: client.id },
      });

      return !!order; // Return true if order exists and belongs to client
    }

    // For other roles, deny access
    return false;
  }
}
