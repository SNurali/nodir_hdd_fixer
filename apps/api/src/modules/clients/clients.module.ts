import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientEntity, UserEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([ClientEntity, UserEntity])],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule { }
