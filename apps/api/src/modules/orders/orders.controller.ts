import {
    Controller, Get, Post, Patch, Param, Body, Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { SlaService } from './sla.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
    CreateOrderDto, UpdateOrderDto, SetPriceDto, UpdateTotalPriceDto,
    AssignMasterDto, CompleteDetailDto, CreateLifecycleDto, PaginationDto,
} from '@hdd-fixer/shared';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly slaService: SlaService,
    ) { }

    @Public()
    @Post()
    @ApiOperation({ summary: 'Create a new order (guest or authenticated)' })
    create(@Body(new ZodValidationPipe(CreateOrderDto)) dto: any, @CurrentUser() user: any) {
        // Guest checkout: user may be null
        return this.ordersService.create(dto, user);
    }

    @Get()
    @Roles('admin', 'operator', 'master')
    @ApiOperation({ summary: 'List all orders' })
    findAll(@Query(new ZodValidationPipe(PaginationDto)) query: any, @CurrentUser() user: any) {
        return this.ordersService.findAll(query, user);
    }

    @Get('my')
    @Roles('client')
    @ApiOperation({ summary: 'My orders (client)' })
    findMyOrders(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(PaginationDto)) query: any,
    ) {
        return this.ordersService.findMyOrders(userId, query);
    }

    @Get('assigned')
    @Roles('master')
    @ApiOperation({ summary: 'Orders assigned to me (master)' })
    findAssigned(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(PaginationDto)) query: any,
    ) {
        return this.ordersService.findAssignedOrders(userId, query);
    }

    @Get('stats')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getStats(@Query('period') period?: 'today' | 'week' | 'month') {
        return this.ordersService.getStats(period);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('admin', 'operator', 'master', 'client')
    @ApiOperation({ summary: 'Get order details' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.ordersService.findOne(id, user);
    }

    @Patch(':id')
    @Roles('admin', 'operator', 'master')
    @ApiOperation({ summary: 'Update order (status, deadline)' })
    update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(UpdateOrderDto)) dto: any,
        @CurrentUser('id') userId: string,
        @CurrentUser('role_name') userRole: string
    ) {
        return this.ordersService.updateOrder(id, dto, userId, userRole as any);
    }

    @Post(':id/accept')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Accept order' })
    accept(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role_name') userRole: string,
    ) {
        return this.ordersService.acceptOrder(id, userId, userRole as any);
    }

    @Post(':id/reject')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Reject (cancel) order' })
    reject(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role_name') userRole: string,
    ) {
        return this.ordersService.rejectOrder(id, userId, userRole as any);
    }

    @Post(':id/set-price')
    @Roles('admin', 'operator', 'master')
    @ApiOperation({ summary: 'Set prices for order details' })
    setPrice(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(SetPriceDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.setPrice(id, dto.details, userId);
    }

    @Post(':id/update-price')
    @Roles('admin', 'operator', 'master')
    @ApiOperation({ summary: 'Update prices for order details (during repair)' })
    updatePrice(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(SetPriceDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.updatePrice(id, dto.details, userId);
    }

    @Post(':id/approve-price')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('client')
    @ApiOperation({ summary: 'Client approves the price' })
    approvePrice(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.ordersService.approvePrice(id, userId);
    }

    @Post(':id/reject-price')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('client')
    @ApiOperation({ summary: 'Client rejects the price' })
    rejectPrice(@Param('id') id: string, @Body() dto: { reason: string }, @CurrentUser('id') userId: string) {
        return this.ordersService.rejectPrice(id, dto.reason, userId);
    }

    @Post(':id/update-total-price')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'operator', 'master')
    @ApiOperation({ summary: 'Update total order price with reason' })
    updateTotalPrice(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(UpdateTotalPriceDto)) dto: any,
        @CurrentUser('id') userId: string
    ) {
        return this.ordersService.updateTotalPrice(id, dto.new_price, dto.reason || null, userId);
    }

    @Get(':id/price-history')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('admin', 'operator', 'client')
    @ApiOperation({ summary: 'Get price change history for order' })
    getPriceHistory(
        @Param('id') id: string
    ) {
        return this.ordersService.getPriceHistory(id);
    }

    @Post(':id/close')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Close order (checks payment)' })
    close(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role_name') userRole: string,
    ) {
        return this.ordersService.closeOrder(id, userId, userRole as any);
    }

    // ===== Detail Sub-endpoints =====
    @Post(':id/details/:detailId/assign')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Assign master to order detail' })
    assignMaster(
        @Param('id') orderId: string,
        @Param('detailId') detailId: string,
        @Body(new ZodValidationPipe(AssignMasterDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.assignMaster(orderId, detailId, dto.master_id, userId);
    }

    // Alternative endpoint for frontend compatibility
    @Post(':id/assign-master')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Assign master to order (alternative endpoint)' })
    assignMasterToOrder(
        @Param('id') orderId: string,
        @Body(new ZodValidationPipe(AssignMasterDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        // Assign to first detail if detailId not provided
        return this.ordersService.assignMasterToOrder(orderId, dto.master_id, userId);
    }

    @Post(':id/details/:detailId/accept')
    @Roles('master')
    @ApiOperation({ summary: 'Master accepts order detail' })
    acceptDetail(
        @Param('id') orderId: string,
        @Param('detailId') detailId: string,
        @CurrentUser('id') masterId: string,
    ) {
        return this.ordersService.acceptByMaster(orderId, detailId, masterId);
    }

    @Post(':id/details/:detailId/complete')
    @Roles('admin', 'master')
    @ApiOperation({ summary: 'Complete order detail' })
    completeDetail(
        @Param('id') orderId: string,
        @Param('detailId') detailId: string,
        @Body(new ZodValidationPipe(CompleteDetailDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.completeDetail(orderId, detailId, dto.is_completed, dto.comments, userId);
    }

    @Post(':id/details/:detailId/return')
    @Roles('admin', 'master')
    @ApiOperation({ summary: 'Return equipment to client' })
    returnEquipment(
        @Param('id') orderId: string,
        @Param('detailId') detailId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.returnEquipment(orderId, detailId, userId);
    }

    // ===== Lifecycle =====
    @Get(':id/lifecycle')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('admin', 'operator', 'master', 'client')
    @ApiOperation({ summary: 'Get order lifecycle history' })
    getLifecycle(@Param('id') orderId: string, @CurrentUser() user: any) {
        return this.ordersService.getLifecycle(orderId, user);
    }

    @Post(':id/lifecycle')
    @Roles('admin', 'master')
    @ApiOperation({ summary: 'Add lifecycle entry' })
    addLifecycle(
        @Param('id') orderId: string,
        @Body(new ZodValidationPipe(CreateLifecycleDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.ordersService.addLifecycleEntry(orderId, dto, userId);
    }

    // ===== SLA & Metrics =====
    @Get('stats/sla')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get SLA metrics' })
    getSlaMetrics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.slaService.getSlaMetrics(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('stats/overdue')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get overdue orders' })
    getOverdueOrders() {
        return this.slaService.getOverdueOrders();
    }

    @Get('stats/near-deadline')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get orders near deadline' })
    getNearDeadlineOrders(@Query('hours') hours?: number) {
        return this.slaService.getNearDeadlineOrders(hours ? Number(hours) : 24);
    }

    @Get(':id/timeline')
    @Roles('admin', 'operator', 'master', 'client')
    @ApiOperation({ summary: 'Get order timeline with durations' })
    getOrderTimeline(@Param('id') orderId: string) {
        return this.slaService.getOrderTimeline(orderId);
    }

    @Get(':id/allowed-transitions')
    @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
    @Roles('admin', 'operator', 'master', 'client')
    @ApiOperation({ summary: 'Get allowed status transitions for order' })
    async getAllowedTransitions(
        @Param('id') id: string,
        @CurrentUser() user: any
    ) {
        const order = await this.ordersService.findOne(id, user);
        const { getAvailableTransitions } = await import('./order-state-machine');
        const transitions = getAvailableTransitions(
            order.status as any,
            user?.role_name as any
        );
        return { transitions };
    }

    @Public()
    @Get('track/:token')
    @ApiOperation({ summary: 'Track order status by public token (guest access)' })
    async trackByToken(@Param('token') token: string) {
        return this.ordersService.findByTrackingToken(token);
    }

}
