import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { IssueEntity, UserEntity } from '../../database/entities';

@Module({
    imports: [TypeOrmModule.forFeature([IssueEntity, UserEntity])],
    controllers: [IssuesController],
    providers: [IssuesService],
})
export class IssuesModule { }
