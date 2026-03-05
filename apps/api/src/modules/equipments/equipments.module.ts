import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsController } from './equipments.controller';
import { EquipmentsService } from './equipments.service';
import { EquipmentEntity, UserEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([EquipmentEntity, UserEntity])],
    controllers: [EquipmentsController],
    providers: [EquipmentsService],
})
export class EquipmentsModule { }
