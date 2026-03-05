import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan } from 'typeorm';
import { PaymentEntity, OrderEntity } from '../../database/entities';

export interface FinancialReport {
    total_revenue: number;
    total_paid: number;
    total_unpaid: number;
    total_overdue: number;
    by_currency: CurrencyReport[];
    by_payment_type: PaymentTypeReport[];
    daily_revenue: DailyRevenue[];
    unpaid_orders: UnpaidOrder[];
}

export interface CurrencyReport {
    currency: string;
    amount: number;
    percentage: number;
}

export interface PaymentTypeReport {
    type: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface DailyRevenue {
    date: string;
    amount: number;
    count: number;
}

export interface UnpaidOrder {
    id: string;
    client_name: string;
    total_amount: number;
    paid_amount: number;
    unpaid_amount: number;
    created_at: string;
    deadline: string | null;
    status: string;
}

@Injectable()
export class FinancialReportService {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
    ) { }

    /**
     * Получить финансовый отчёт за период
     */
    async getReport(startDate?: Date, endDate?: Date): Promise<FinancialReport> {
        const where: any = {};

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.$gte = startDate;
            if (endDate) where.created_at.$lte = endDate;
        }

        // Get all payments
        const payments = await this.paymentRepo.find({
            where,
            relations: ['order'],
        });

        // Get all orders
        const orderWhere: any = {};
        if (startDate || endDate) {
            orderWhere.created_at = betweenDates(startDate, endDate);
        }
        const orders = await this.orderRepo.find({
            where: orderWhere,
            relations: ['client'],
        });

        // Calculate totals
        const total_revenue = payments.reduce((sum, p) => sum + p.paid_amount, 0);

        const total_paid = orders.reduce((sum, o) => sum + (Number(o.total_paid_uzs) || 0), 0);
        const total_price = orders.reduce((sum, o) => sum + (Number(o.total_price_uzs) || 0), 0);
        const total_unpaid = total_price - total_paid;

        // Overdue (unpaid and deadline passed)
        const now = new Date();
        const overdueOrders = orders.filter(o =>
            o.deadline &&
            new Date(o.deadline) < now &&
            o.status !== 'issued' &&
            Number(o.total_paid_uzs) < Number(o.total_price_uzs)
        );
        const total_overdue = overdueOrders.reduce(
            (sum, o) => sum + (Number(o.total_price_uzs) - Number(o.total_paid_uzs)),
            0
        );

        // By currency
        const by_currency: CurrencyReport[] = [];
        const currencyMap = new Map<string, number>();

        for (const payment of payments) {
            const currency = payment.currency || 'UZS';
            currencyMap.set(currency, (currencyMap.get(currency) || 0) + payment.paid_amount);
        }

        for (const [currency, amount] of currencyMap.entries()) {
            by_currency.push({
                currency,
                amount,
                percentage: total_revenue > 0 ? (amount / total_revenue) * 100 : 0,
            });
        }

        // By payment type
        const by_payment_type: PaymentTypeReport[] = [];
        const typeMap = new Map<string, { amount: number; count: number }>();

        for (const payment of payments) {
            const type = payment.payment_type;
            const existing = typeMap.get(type) || { amount: 0, count: 0 };
            typeMap.set(type, {
                amount: existing.amount + payment.paid_amount,
                count: existing.count + 1,
            });
        }

        for (const [type, data] of typeMap.entries()) {
            by_payment_type.push({
                type,
                amount: data.amount,
                count: data.count,
                percentage: total_revenue > 0 ? (data.amount / total_revenue) * 100 : 0,
            });
        }

        // Daily revenue
        const daily_revenue: DailyRevenue[] = [];
        const dailyMap = new Map<string, { amount: number; count: number }>();

        for (const payment of payments) {
            const date = new Date(payment.paid_at).toISOString().split('T')[0];
            const existing = dailyMap.get(date) || { amount: 0, count: 0 };
            dailyMap.set(date, {
                amount: existing.amount + payment.paid_amount,
                count: existing.count + 1,
            });
        }

        for (const [date, data] of dailyMap.entries()) {
            daily_revenue.push({
                date,
                amount: data.amount,
                count: data.count,
            });
        }
        daily_revenue.sort((a, b) => a.date.localeCompare(b.date));

        // Unpaid orders
        const unpaid_orders: UnpaidOrder[] = orders
            .filter(o => Number(o.total_paid_uzs) < Number(o.total_price_uzs))
            .map(o => ({
                id: o.id,
                client_name: o.client?.full_name || 'Unknown',
                total_amount: Number(o.total_price_uzs),
                paid_amount: Number(o.total_paid_uzs),
                unpaid_amount: Number(o.total_price_uzs) - Number(o.total_paid_uzs),
                created_at: o.created_at.toISOString(),
                deadline: o.deadline?.toISOString() || null,
                status: o.status,
            }))
            .sort((a, b) => b.unpaid_amount - a.unpaid_amount);

        return {
            total_revenue,
            total_paid,
            total_unpaid,
            total_overdue,
            by_currency,
            by_payment_type,
            daily_revenue,
            unpaid_orders,
        };
    }

    /**
     * Получить неоплаченные заказы
     */
    async getUnpaidOrders(): Promise<UnpaidOrder[]> {
        const orders = await this.orderRepo.find({
            where: {
                status: Not('issued'),
            },
            relations: ['client'],
            order: { created_at: 'DESC' },
        });

        return orders
            .filter(o => Number(o.total_paid_uzs) < Number(o.total_price_uzs))
            .map(o => ({
                id: o.id,
                client_name: o.client?.full_name || 'Unknown',
                total_amount: Number(o.total_price_uzs),
                paid_amount: Number(o.total_paid_uzs),
                unpaid_amount: Number(o.total_price_uzs) - Number(o.total_paid_uzs),
                created_at: o.created_at.toISOString(),
                deadline: o.deadline?.toISOString() || null,
                status: o.status,
            }));
    }

    /**
     * Получить просроченную задолженность
     */
    async getOverdueDebt(): Promise<{
        total_overdue: number;
        orders: UnpaidOrder[];
    }> {
        const orders = await this.orderRepo.find({
            where: {
                deadline: LessThan(new Date()),
                status: Not('issued'),
            },
            relations: ['client'],
            order: { deadline: 'ASC' },
        });

        const overdueOrders = orders.filter(
            o => Number(o.total_paid_uzs) < Number(o.total_price_uzs)
        );

        const total_overdue = overdueOrders.reduce(
            (sum, o) => sum + (Number(o.total_price_uzs) - Number(o.total_paid_uzs)),
            0
        );

        const ordersList: UnpaidOrder[] = overdueOrders.map(o => ({
            id: o.id,
            client_name: o.client?.full_name || 'Unknown',
            total_amount: Number(o.total_price_uzs),
            paid_amount: Number(o.total_paid_uzs),
            unpaid_amount: Number(o.total_price_uzs) - Number(o.total_paid_uzs),
            created_at: o.created_at.toISOString(),
            deadline: o.deadline?.toISOString() || null,
            status: o.status,
        }));

        return { total_overdue, orders: ordersList };
    }

    /**
     * Получить статистику по методам оплаты
     */
    async getPaymentMethodStats(startDate?: Date, endDate?: Date): Promise<PaymentTypeReport[]> {
        const where: any = {};
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.$gte = startDate;
            if (endDate) where.created_at.$lte = endDate;
        }

        const payments = await this.paymentRepo.find({ where });

        const typeMap = new Map<string, { amount: number; count: number }>();
        const total = payments.reduce((sum, p) => sum + p.paid_amount, 0);

        for (const payment of payments) {
            const type = payment.payment_type;
            const existing = typeMap.get(type) || { amount: 0, count: 0 };
            typeMap.set(type, {
                amount: existing.amount + payment.paid_amount,
                count: existing.count + 1,
            });
        }

        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            amount: data.amount,
            count: data.count,
            percentage: total > 0 ? (data.amount / total) * 100 : 0,
        }));
    }
}

function betweenDates(start?: Date, end?: Date) {
    const result: any = {};
    if (start) result.$gte = start;
    if (end) result.$lte = end;
    return result;
}
