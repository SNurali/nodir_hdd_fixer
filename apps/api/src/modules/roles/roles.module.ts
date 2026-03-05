import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleEntity, UserEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([RoleEntity, UserEntity])],
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule { }
