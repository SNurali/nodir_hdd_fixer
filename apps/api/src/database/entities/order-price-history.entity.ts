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
import { UserEntity } from './user.entity';
import { OrderDetailEntity } from './order-detail.entity';

@Entity('order_price_history')
export class OrderPriceHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_order_price_history_order_id')
    @Column({ type: 'uuid' })
    order_id: string;

    @ManyToOne(() => OrderEntity, { eager: true })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @Column({ type: 'uuid', nullable: true })
    order_detail_id?: string | null;

    @ManyToOne(() => OrderDetailEntity, { nullable: true })
    @JoinColumn({ name: 'order_detail_id' })
    order_detail?: OrderDetailEntity | null;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    old_price: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    new_price: number;

    @Column({ type: 'text', nullable: true })
    reason: string | null;

    @Column({ type: 'uuid', nullable: true })
    changed_by: string | null;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'changed_by' })
    user: UserEntity | null;

    @CreateDateColumn({ type: 'timestamptz' })
    changed_at: Date;
}