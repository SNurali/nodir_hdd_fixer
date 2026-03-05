import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ClientEntity } from '../../database/entities';
import { TCreateClientDto, TUpdateClientDto, TPaginationDto } from '@hdd-fixer/shared';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
    ) { }

    async findAll(query: TPaginationDto) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.full_name = ILike(`%${search}%`);
        }

        const [data, total] = await this.clientRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return { data, meta: { total, page, limit } };
    }

    async findOne(id: string) {
        const client = await this.clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Client not found');
        return client;
    }

    async create(dto: TCreateClientDto, createdById: string) {
        const client = this.clientRepo.create({
            ...dto,
            created_by: createdById,
        });
        return this.clientRepo.save(client);
    }

    async update(id: string, dto: TUpdateClientDto) {
        const client = await this.findOne(id);
        Object.assign(client, dto);
        return this.clientRepo.save(client);
    }

    async search(q: string) {
        return this.clientRepo.find({
            where: [
                { full_name: ILike(`%${q}%`) },
                { phone: ILike(`%${q}%`) },
            ],
            take: 20,
        });
    }
}
