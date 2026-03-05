import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity, RoleEntity, ClientEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, ClientEntity])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
