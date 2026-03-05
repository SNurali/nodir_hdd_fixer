import { Controller, Get, Post, Patch, Param, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateServiceDto, UpdateServiceDto } from '@hdd-fixer/shared';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly service: ServicesService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all service types' })
    findAll() { return this.service.findAll(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Create service type' })
    @UsePipes(new ZodValidationPipe(CreateServiceDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.service.create(dto, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Update service type' })
    @UsePipes(new ZodValidationPipe(UpdateServiceDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.service.update(id, dto);
    }
}
