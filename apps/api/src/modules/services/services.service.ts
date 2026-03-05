import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../database/entities';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(ServiceEntity)
        private readonly repo: Repository<ServiceEntity>,
    ) { }

    findAll() { return this.repo.find({ order: { name_eng: 'ASC' } }); }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Service not found');
        return item;
    }

    create(dto: any, createdById: string) {
        return this.repo.save(this.repo.create({ ...dto, created_by: createdById }));
    }

    async update(id: string, dto: any) {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        return this.repo.save(item);
    }
}
