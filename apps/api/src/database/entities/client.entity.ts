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
import { UserEntity } from './user.entity';

@Entity('clients')
export class ClientEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('idx_clients_user_id')
    @Column({ type: 'uuid', nullable: true })
    user_id: string | null;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity | null;

    @Column({ type: 'varchar', length: 255 })
    full_name: string;

    @Index('idx_clients_phone')
    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    telegram: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string | null;

    @Column({
        type: 'varchar',
        length: 6,
        default: 'ru',
    })
    preferred_language: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    gender: 'male' | 'female' | 'other' | null;

    @Column({ type: 'date', nullable: true })
    date_of_birth: string | null;

    @Column({ type: 'uuid', nullable: true })
    created_by: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
