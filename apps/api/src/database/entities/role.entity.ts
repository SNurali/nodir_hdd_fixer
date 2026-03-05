import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name_rus: string;

    @Column({ type: 'varchar', length: 100 })
    name_cyr: string;

    @Column({ type: 'varchar', length: 100 })
    name_lat: string;

    @Column({ type: 'varchar', length: 100 })
    name_eng: string;

    @Column({ type: 'uuid', nullable: true })
    created_by: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
