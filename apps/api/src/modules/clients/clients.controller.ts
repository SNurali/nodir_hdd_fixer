import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateClientDto, UpdateClientDto, PaginationDto } from '@hdd-fixer/shared';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'List clients with pagination' })
    findAll(@Query(new ZodValidationPipe(PaginationDto)) query: any) {
        return this.clientsService.findAll(query);
    }

    @Get('search')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Search clients by name or phone' })
    search(@Query('q') q: string) {
        return this.clientsService.search(q || '');
    }

    @Get(':id')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get client by ID' })
    findOne(@Param('id') id: string) {
        return this.clientsService.findOne(id);
    }

    @Post()
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Create a client' })
    @UsePipes(new ZodValidationPipe(CreateClientDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.clientsService.create(dto, userId);
    }

    @Patch(':id')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Update a client' })
    @UsePipes(new ZodValidationPipe(UpdateClientDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.clientsService.update(id, dto);
    }
}
