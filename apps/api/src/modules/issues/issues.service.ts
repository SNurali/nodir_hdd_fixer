import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueEntity } from '../../database/entities';

@Injectable()
export class IssuesService {
    constructor(
        @InjectRepository(IssueEntity)
        private readonly repo: Repository<IssueEntity>,
    ) { }

    findAll() { return this.repo.find({ order: { name_eng: 'ASC' } }); }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Issue not found');
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
