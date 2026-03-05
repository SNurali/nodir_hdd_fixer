import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { OrderEntity } from './order.entity';

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_notifications_user_id')
    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'uuid', nullable: true })
    order_id: string | null;

    @ManyToOne(() => OrderEntity, { nullable: true })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity | null;

    @Column({ type: 'varchar', length: 10 })
    channel: string;

    @Column({ type: 'varchar', length: 100 })
    template_key: string;

    @Column({ type: 'varchar', length: 6 })
    language: string;

    @Column({ type: 'jsonb', default: '{}' })
    payload: Record<string, unknown>;

    @Index('idx_notifications_status')
    @Column({ type: 'varchar', length: 10, default: 'pending' })
    status: string;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    sent_at: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
