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
import { ServiceEntity } from './service.entity';
import { EquipmentEntity } from './equipment.entity';
import { IssueEntity } from './issue.entity';
import { UserEntity } from './user.entity';

@Entity('order_details')
export class OrderDetailEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_order_details_order_id')
    @Column({ type: 'uuid' })
    order_id: string;

    @ManyToOne(() => OrderEntity, (order) => order.details, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @Column({ type: 'uuid' })
    service_id: string;

    @ManyToOne(() => ServiceEntity, { eager: true })
    @JoinColumn({ name: 'service_id' })
    service: ServiceEntity;

    @Column({ type: 'uuid' })
    equipment_id: string;

    @ManyToOne(() => EquipmentEntity, { eager: true })
    @JoinColumn({ name: 'equipment_id' })
    equipment: EquipmentEntity;

    @Column({ type: 'uuid' })
    issue_id: string;

    @ManyToOne(() => IssueEntity, { eager: true })
    @JoinColumn({ name: 'issue_id' })
    issue: IssueEntity;

    @Column({ type: 'text', nullable: true })
    description_of_issue: string | null;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    price: number;

    @Index('idx_order_details_attached_to')
    @Column({ type: 'uuid', nullable: true })
    attached_to: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    master_accepted_at: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    completed_at: Date | null;

    @Column({ type: 'text', nullable: true })
    completed_comments: string | null;

    @Column({ type: 'uuid', nullable: true })
    attached_by: string | null;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'attached_to' })
    master: UserEntity | null;

    @Column({ type: 'timestamptz', nullable: true })
    attached_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    accepted_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    accepted_at: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    took_equipment_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    took_equipment_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    returned_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    returned_by: string | null;

    @Column({ type: 'smallint', default: 0 })
    is_completed: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
