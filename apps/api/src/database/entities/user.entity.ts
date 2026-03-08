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
import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    full_name: string;

    @Index('idx_users_email')
    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    email: string | null;

    @Index('idx_users_phone')
    @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
    phone: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    telegram: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password_hash: string | null;

    @Index('idx_users_role_id')
    @Column({ type: 'uuid' })
    role_id: string;

    @ManyToOne(() => RoleEntity, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: RoleEntity;

    @Column({
        type: 'varchar',
        length: 6,
        default: 'ru',
    })
    preferred_language: string;

    @Column({ type: 'text', nullable: true })
    fcm_token: string | null;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    avatar_url: string | null;

    @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
    account_settings: Record<string, unknown> | null;

    @Column({ type: 'varchar', length: 128, nullable: true })
    password_reset_token_hash: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    password_reset_expires_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    created_by: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
