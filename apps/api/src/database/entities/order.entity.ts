import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { ClientEntity } from './client.entity';
import { OrderDetailEntity } from './order-detail.entity';
import { PaymentEntity } from './payment.entity';
import { OrderLifecycleEntity } from './order-lifecycle.entity';

@Entity('orders')
export class OrderEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    order_date: string;

    @Column({ type: 'time', default: () => 'CURRENT_TIME' })
    order_time: string;

    @Index('idx_orders_status')
    @Column({ type: 'varchar', length: 30, default: 'new' })
    status: string;

    @Column({ type: 'timestamptz', nullable: true })
    deadline: Date | null;

    @Column({ type: 'varchar', length: 6, default: 'ru' })
    language: string;

    @Index('idx_orders_client_id')
    @Column({ type: 'uuid' })
    client_id: string;

    @ManyToOne(() => ClientEntity)
    @JoinColumn({ name: 'client_id' })
    client: ClientEntity;

    @Column({ type: 'integer', default: 0 })
    total_qty: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    total_price_uzs: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    total_paid_uzs: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    total_paid_usd: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    total_paid_eur: number;

    @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
    currency_rate_usd: number;

    @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
    currency_rate_eur: number;

    @Column({ type: 'integer', default: 0 })
    total_completed_orders: number;

    @Column({ type: 'timestamptz', nullable: true })
    closed_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    closed_by: string | null;

    @Index('idx_orders_created_by')
    @Column({ type: 'uuid' })
    created_by: string;

    @Index('idx_orders_created_at')
    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    // Relations
    @OneToMany(() => OrderDetailEntity, (detail) => detail.order, {
        cascade: true,
    })
    details: OrderDetailEntity[];

    @OneToMany(() => PaymentEntity, (payment) => payment.order)
    payments: PaymentEntity[];

    @OneToMany(() => OrderLifecycleEntity, (lifecycle) => lifecycle.order)
    lifecycle: OrderLifecycleEntity[];

    // Additional fields for state machine and tracking
    @Column({ type: 'text', nullable: true })
    diagnostics_report: string | null;

    @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, default: 0 })
    estimated_price: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    estimated_days: number | null;

    @Column({ type: 'integer', default: 1 })
    version: number;

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    public_tracking_token: string | null;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    updated_at: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    price_approved_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    price_approved_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    cancelled_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    cancelled_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    accepted_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    accepted_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    price_last_updated: Date | null;

    @Column({ type: 'uuid', nullable: true })
    price_last_updated_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    price_rejected_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    price_rejected_by: string | null;

    @Column({ type: 'text', nullable: true })
    price_rejection_reason: string | null;
}
