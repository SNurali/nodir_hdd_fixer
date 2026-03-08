import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipmentsService } from './equipments.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateEquipmentDto, UpdateEquipmentDto } from '@hdd-fixer/shared';

@ApiTags('Equipments')
@Controller('equipments')
export class EquipmentsController {
    constructor(private readonly service: EquipmentsService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all equipment types' })
    findAll() { return this.service.findAll(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Create equipment type' })
    @UsePipes(new ZodValidationPipe(CreateEquipmentDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.service.create(dto, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Update equipment type' })
    @UsePipes(new ZodValidationPipe(UpdateEquipmentDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Delete equipment type' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
