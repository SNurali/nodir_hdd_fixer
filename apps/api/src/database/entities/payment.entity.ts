import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';

@Entity('payments')
export class PaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_payments_order_id')
    @Column({ type: 'uuid' })
    order_id: string;

    @ManyToOne(() => OrderEntity, (order) => order.payments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @Column({ type: 'varchar', length: 20 })
    payment_type: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    paid_amount: number;

    @Column({ type: 'varchar', length: 3, default: 'UZS' })
    currency: string;

    @Column({ type: 'timestamptz', default: () => 'NOW()' })
    paid_at: Date;

    @Column({ type: 'uuid', nullable: true })
    cashier_by: string | null;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'cashier_by' })
    cashier: UserEntity;

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    external_txn_id: string | null;

    @Column({ type: 'varchar', length: 50, default: 'other' })
    provider: string;
}
