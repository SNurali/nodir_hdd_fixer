import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { OrderEntity } from '../../database/entities/order.entity';
import { OrderLifecycleEntity } from '../../database/entities/order-lifecycle.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { canTransition, OrderRole } from './order-state-machine';

@Injectable()
export class StateMachineService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderLifecycleEntity)
    private lifecycleRepo: Repository<OrderLifecycleEntity>,
  ) { }

  /**
   * Transition order to a new status with validation
   */
  async transitionToStatus(
    orderId: string,
    newStatus: string,
    actor: UserEntity,
    reason?: string,
    additionalData?: any,
  ): Promise<OrderEntity> {
    // Get current order - use query runner for transaction
    const queryRunner = this.orderRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(OrderEntity, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Validate transition
      this.validateTransition(order.status, newStatus, actor, additionalData);

      // Check business rules for specific transitions
      await this.checkBusinessRules(order, newStatus, additionalData, queryRunner.manager);

      // Update order status and version for optimistic locking
      const updatedVersion = order.version + 1;
      const result = await queryRunner.manager.update(
        OrderEntity,
        { id: orderId, version: order.version },
        {
          status: newStatus,
          version: updatedVersion,
          updated_at: new Date(),
          updated_by: actor.id,
        },
      );

      // Check if update was successful (affectedRows > 0)
      if (result.affected === 0) {
        throw new ConflictException('Order was modified by another process. Please refresh and try again.');
      }

      // Add lifecycle entry
      await this.addLifecycleEntry(orderId, newStatus, order.status, actor, reason, queryRunner.manager);

      await queryRunner.commitTransaction();

      // Return updated order
      const updatedOrder = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!updatedOrder) {
        throw new BadRequestException('Order not found after update');
      }
      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateTransition(
    currentStatus: string,
    newStatus: string,
    actor: UserEntity,
    additionalData?: any,
  ): void {
    if (currentStatus === newStatus) return;

    const roleName = (actor.role?.name_eng?.toLowerCase() || 'master') as OrderRole;
    const result = canTransition(currentStatus as any, newStatus as any, roleName);

    if (!result.allowed) {
      throw new BadRequestException(
        result.reason || `Invalid status transition: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private async checkBusinessRules(
    order: OrderEntity,
    newStatus: string,
    additionalData?: any,
    manager?: any,
  ): Promise<void> {
    // Requirements validation is handled dynamically in orders.service.ts
    // via validateTransitionRequirements from order-state-machine.ts
  }

  private async addLifecycleEntry(
    orderId: string,
    newStatus: string,
    fromStatus: string | null,
    actor: UserEntity,
    reason?: string,
    manager?: any,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(OrderLifecycleEntity) : this.lifecycleRepo;
    const baseReason = reason || `Статус изменён с "${fromStatus || 'unknown'}" на "${newStatus}"`;

    const lifecycle = repo.create({
      order_id: orderId,
      comments: baseReason,
      is_completed: 0,
      created_by: actor.id,
      action_type: 'status_change',
      from_status: fromStatus,
      to_status: newStatus,
      actor_id: actor.id,
      actor_role: actor.role ? actor.role.name_eng : 'unknown',
      reason: baseReason,
      metadata: {
        field_name: 'status',
        old_value: fromStatus,
        new_value: newStatus,
        from_status: fromStatus,
        to_status: newStatus,
        actor_id: actor.id,
        actor_role: actor.role ? actor.role.name_eng : 'unknown',
        reason: baseReason
      }
    });

    await repo.save(lifecycle);
  }

  canTransitionTo(currentStatus: string, newStatus: string): boolean {
    if (currentStatus === newStatus) return true;
    // Use canonical state machine - check with admin role to get all transitions
    const result = canTransition(currentStatus as any, newStatus as any, 'admin');
    return result.allowed;
  }
}
