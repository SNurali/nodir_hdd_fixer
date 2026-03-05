import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { OrderEntity } from './order.entity';

@Entity('messages')
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_messages_order_id')
    @Column({ type: 'uuid' })
    order_id: string;

    @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @Index('idx_messages_sender_id')
    @Column({ type: 'uuid' })
    sender_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'sender_id' })
    sender: UserEntity;

    @Column({ type: 'uuid', nullable: true })
    recipient_id?: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'recipient_id' })
    recipient?: UserEntity;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    read_at?: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: any;
}
