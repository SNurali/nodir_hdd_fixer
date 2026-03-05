import {
    Controller, Get, Post, Patch, Param, Body, UseGuards, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateRoleDto, UpdateRoleDto } from '@hdd-fixer/shared';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'List all roles' })
    findAll() { return this.rolesService.findAll(); }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a role' })
    @UsePipes(new ZodValidationPipe(CreateRoleDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.rolesService.create(dto, userId);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update a role' })
    @UsePipes(new ZodValidationPipe(UpdateRoleDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.rolesService.update(id, dto);
    }
}
