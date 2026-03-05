import { Controller, Get, Post, Patch, Param, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateIssueDto, UpdateIssueDto } from '@hdd-fixer/shared';

@ApiTags('Issues')
@Controller('issues')
export class IssuesController {
    constructor(private readonly service: IssuesService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all issue types' })
    findAll() { return this.service.findAll(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Create issue type' })
    @UsePipes(new ZodValidationPipe(CreateIssueDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.service.create(dto, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Update issue type' })
    @UsePipes(new ZodValidationPipe(UpdateIssueDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.service.update(id, dto);
    }
}
