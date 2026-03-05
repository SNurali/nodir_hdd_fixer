import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { OrderDetailEntity } from './order-detail.entity';
import { UserEntity } from './user.entity';

@Entity('order_lifecycle')
export class OrderLifecycleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_order_lifecycle_order_id')
    @Column({ type: 'uuid' })
    order_id: string;

    @ManyToOne(() => OrderEntity, (order) => order.lifecycle, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @Index('idx_order_lifecycle_details_id')
    @Column({ type: 'uuid', nullable: true })
    order_details_id: string | null;

    @ManyToOne(() => OrderDetailEntity, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_details_id' })
    orderDetail: OrderDetailEntity | null;

    @Column({ type: 'text', nullable: true })
    comments: string | null;

    @Column({ type: 'text', nullable: true })
    comments_en: string | null; // English translation

    @Column({ type: 'text', nullable: true })
    comments_uz: string | null; // Uzbek translation

    @Column({ type: 'smallint', default: 0 })
    is_completed: number;

    @Column({ type: 'uuid' })
    created_by: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'created_by' })
    creator: UserEntity;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    // Audit fields for state machine
    @Column({ type: 'varchar', length: 50, nullable: true, default: 'status_change' })
    action_type: string | null; // 'status_change', 'price_set', 'master_assigned', etc.

    @Column({ type: 'jsonb', nullable: true })
    metadata: any | null; // { old_value, new_value, field_name }

    // Fields to track actor and status transition
    @Column({ type: 'uuid', nullable: true })
    actor_id: string | null; // ID of the user who made the change

    @Column({ type: 'varchar', length: 50, nullable: true })
    actor_role: string | null; // Role of the user who made the change

    @Column({ type: 'varchar', length: 50, nullable: true })
    from_status: string | null; // Previous status

    @Column({ type: 'varchar', length: 50, nullable: true })
    to_status: string | null; // New status

    @Column({ type: 'text', nullable: true })
    reason: string | null; // Reason for the status change
}
