import { Controller, Get, Post, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { FinancialReportService } from './financial-report.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreatePaymentDto } from '@hdd-fixer/shared';
import { ClickWebhookDto, PaymeWebhookDto } from './dto/webhook.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly financialReportService: FinancialReportService,
    ) { }

    @Post('orders/:orderId')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Add payment to order' })
    create(
        @Param('orderId') orderId: string,
        @Body(new ZodValidationPipe(CreatePaymentDto)) dto: any,
        @CurrentUser('id') userId: string,
    ) {
        return this.paymentsService.create(orderId, dto, userId);
    }

    @Get('orders/:orderId')
    @Roles('admin', 'operator', 'client')
    @ApiOperation({ summary: 'Get payment history for order' })
    findAll(@Param('orderId') orderId: string, @CurrentUser() user: any) {
        return this.paymentsService.findByOrder(orderId, user);
    }

    @Get('orders/:orderId/total')
    @Roles('admin', 'operator', 'client')
    @ApiOperation({ summary: 'Get total paid amount for order' })
    getTotalPaid(@Param('orderId') orderId: string) {
        return this.paymentsService.getTotalPaid(orderId);
    }

    @Post('refund/:paymentId')
    @Roles('admin')
    @ApiOperation({ summary: 'Refund a payment' })
    refund(
        @Param('paymentId') paymentId: string,
        @Body() dto: { reason: string },
        @CurrentUser('id') userId: string,
    ) {
        // Validate UUID format
        if (!paymentId || paymentId.length < 36) {
            throw new BadRequestException('Invalid payment ID format');
        }
        return this.paymentsService.refund(paymentId, userId, dto.reason);
    }

    // ============================================
    // CLICK PAYMENT WEBHOOKS
    // ============================================

    @Post('click/webhook')
    @Public()
    @ApiOperation({ summary: 'Click payment webhook' })
    async clickWebhook(@Body() data: ClickWebhookDto) {
        return this.paymentsService.handleClickWebhook(data);
    }

    @Post('click/create/:orderId')
    @Roles('admin', 'operator', 'client')
    @ApiOperation({ summary: 'Create Click payment URL' })
    async createClick(
        @Param('orderId') orderId: string,
        @Body() dto: { amount: number },
    ) {
        return this.paymentsService.createClickPayment(orderId, dto.amount);
    }

    // ============================================
    // PAYME PAYMENT WEBHOOKS
    // ============================================

    @Post('payme/callback')
    @Public()
    @ApiOperation({ summary: 'Payme payment callback' })
    async paymeCallback(@Body() request: PaymeWebhookDto, @Req() req: any) {
        const headers = req.headers;
        return this.paymentsService.handlePaymeCallback(request.method, request.params, headers);
    }

    @Post('payme/create/:orderId')
    @Roles('admin', 'operator', 'client')
    @ApiOperation({ summary: 'Create Payme payment URL' })
    async createPayme(
        @Param('orderId') orderId: string,
        @Body() dto: { amount: number },
    ) {
        return this.paymentsService.createPaymePayment(orderId, dto.amount);
    }

    // ============================================
    // STATISTICS
    // ============================================

    @Get('stats')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get payment statistics' })
    getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.paymentsService.getStats(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('daily-revenue')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get daily revenue' })
    getDailyRevenue(@Query('days') days: number = 30) {
        return this.paymentsService.getDailyRevenue(days);
    }

    // ============================================
    // FINANCIAL REPORTS
    // ============================================

    @Get('reports/financial')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get financial report' })
    getFinancialReport(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financialReportService.getReport(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('reports/unpaid')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get unpaid orders' })
    getUnpaidOrders() {
        return this.financialReportService.getUnpaidOrders();
    }

    @Get('reports/overdue')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get overdue debt' })
    getOverdueDebt() {
        return this.financialReportService.getOverdueDebt();
    }

    @Get('reports/payment-methods')
    @Roles('admin', 'operator')
    @ApiOperation({ summary: 'Get payment method statistics' })
    getPaymentMethodStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.financialReportService.getPaymentMethodStats(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }
}
