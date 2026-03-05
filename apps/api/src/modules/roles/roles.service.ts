import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../database/entities';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(RoleEntity)
        private readonly roleRepo: Repository<RoleEntity>,
    ) { }

    async findAll() {
        return this.roleRepo.find({ order: { created_at: 'ASC' } });
    }

    async findOne(id: string) {
        const role = await this.roleRepo.findOne({ where: { id } });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async create(dto: any, createdById: string) {
        const role = this.roleRepo.create({ ...dto, created_by: createdById });
        return this.roleRepo.save(role);
    }

    async update(id: string, dto: any) {
        const role = await this.findOne(id);
        Object.assign(role, dto);
        return this.roleRepo.save(role);
    }
}
