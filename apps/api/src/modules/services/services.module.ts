import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceEntity, UserEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceEntity, UserEntity])],
    controllers: [ServicesController],
    providers: [ServicesService],
})
export class ServicesModule { }
