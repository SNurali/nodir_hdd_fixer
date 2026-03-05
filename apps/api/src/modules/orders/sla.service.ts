import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, And, In } from 'typeorm';
import { OrderEntity } from '../../database/entities';
import { AuditService } from './audit.service';

export interface SlaMetrics {
    average_time_in_status: Record<string, number>; // ms
    total_orders: number;
    completed_orders: number;
    overdue_orders: number;
    on_time_percentage: number;
    by_status: StatusMetrics[];
}

export interface StatusMetrics {
    status: string;
    count: number;
    average_duration_ms: number;
    average_duration_formatted: string;
}

export interface OrderTimeline {
    order_id: string;
    timeline: TimelineEntry[];
    total_duration_ms: number;
    is_overdue: boolean;
}

export interface TimelineEntry {
    status: string;
    entered_at: Date;
    exited_at: Date | null;
    duration_ms: number | null;
    duration_formatted: string | null;
}

@Injectable()
export class SlaService {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Получить SLA метрики за период
     */
    async getSlaMetrics(startDate?: Date, endDate?: Date): Promise<SlaMetrics> {
        const where: any = {};

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.$gte = startDate;
            if (endDate) where.created_at.$lte = endDate;
        }

        const [orders, total] = await this.orderRepo.findAndCount({ where });
        const completed = orders.filter(o => o.status === 'issued');

        // Calculate overdue (deadline passed and not issued)
        const now = new Date();
        const overdue = orders.filter(o =>
            o.deadline &&
            new Date(o.deadline) < now &&
            !['issued', 'cancelled'].includes(o.status)
        );

        // Calculate average time in each status
        const statusTimes: Record<string, number[]> = {};

        for (const order of orders) {
            const timeline = await this.getOrderTimeline(order.id);

            for (const entry of timeline.timeline) {
                if (!statusTimes[entry.status]) {
                    statusTimes[entry.status] = [];
                }

                if (entry.duration_ms !== null) {
                    statusTimes[entry.status].push(entry.duration_ms);
                }
            }
        }

        const average_time_in_status: Record<string, number> = {};
        for (const [status, times] of Object.entries(statusTimes)) {
            average_time_in_status[status] =
                times.length > 0
                    ? times.reduce((a, b) => a + b, 0) / times.length
                    : 0;
        }

        const by_status: StatusMetrics[] = Object.entries(statusTimes).map(([status, times]) => ({
            status,
            count: times.length,
            average_duration_ms: times.length > 0
                ? times.reduce((a, b) => a + b, 0) / times.length
                : 0,
            average_duration_formatted: times.length > 0
                ? this.formatDuration(times.reduce((a, b) => a + b, 0) / times.length)
                : 'N/A',
        }));

        return {
            average_time_in_status,
            total_orders: total,
            completed_orders: completed.length,
            overdue_orders: overdue.length,
            on_time_percentage: total > 0
                ? ((total - overdue.length) / total) * 100
                : 100,
            by_status,
        };
    }

    /**
     * Получить таймлайн заказа с длительностью статусов
     */
    async getOrderTimeline(orderId: string): Promise<OrderTimeline> {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) {
            throw new Error('Order not found');
        }

        const history = await this.auditService.getOrderHistory(orderId);
        const statusChanges = history.filter(h => h.action_type === 'status_change');

        const timeline: TimelineEntry[] = [];

        // Add initial status
        if (statusChanges.length > 0) {
            const firstChange = statusChanges[0];
            timeline.push({
                status: 'new',
                entered_at: order.created_at,
                exited_at: firstChange.created_at,
                duration_ms: firstChange.created_at.getTime() - order.created_at.getTime(),
                duration_formatted: this.formatDuration(
                    firstChange.created_at.getTime() - order.created_at.getTime()
                ),
            });

            // Add status changes
            for (let i = 0; i < statusChanges.length; i++) {
                const current = statusChanges[i];
                const next = statusChanges[i + 1];

                const enteredAt = current.created_at;
                const exitedAt = next?.created_at || new Date();
                const durationMs = exitedAt.getTime() - enteredAt.getTime();

                timeline.push({
                    status: current.metadata?.new_value || current.comments,
                    entered_at: enteredAt,
                    exited_at: exitedAt,
                    duration_ms: next ? durationMs : null, // null for current status
                    duration_formatted: next
                        ? this.formatDuration(durationMs)
                        : 'в процессе',
                });
            }
        }

        const totalDurationMs = timeline.reduce((sum, entry) =>
            sum + (entry.duration_ms || 0), 0
        );

        const isOverdue = order.deadline
            ? new Date(order.deadline) < new Date() && !['issued', 'cancelled'].includes(order.status)
            : false;

        return {
            order_id: orderId,
            timeline,
            total_duration_ms: totalDurationMs,
            is_overdue: isOverdue,
        };
    }

    /**
     * Получить просроченные заказы
     */
    async getOverdueOrders(): Promise<OrderEntity[]> {
        const now = new Date();

        const orders = await this.orderRepo.find({
            where: {
                deadline: LessThan(now),
                status: Not(In(['issued', 'cancelled'])),
            },
            relations: ['client', 'details'],
            order: { deadline: 'ASC' },
        });

        return orders;
    }

    /**
     * Получить заказы близкие к дедлайну (< 24 часов)
     */
    async getNearDeadlineOrders(hours = 24): Promise<OrderEntity[]> {
        const now = new Date();
        const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const orders = await this.orderRepo.find({
            where: {
                deadline: And(LessThan(threshold), MoreThan(now)),
                status: Not(In(['issued', 'cancelled'])),
            },
            relations: ['client', 'details'],
            order: { deadline: 'ASC' },
        });

        return orders;
    }

    /**
     * Расчёт среднего времени выполнения заказа
     */
    async calculateAverageCompletionTime(
        startDate?: Date,
        endDate?: Date
    ): Promise<{
        average_ms: number;
        average_formatted: string;
        total_completed: number;
    }> {
        const where: any = { status: 'issued' };

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.$gte = startDate;
            if (endDate) where.created_at.$lte = endDate;
        }

        const completedOrders = await this.orderRepo.find({
            where,
            relations: ['lifecycle'],
        });

        const durations: number[] = [];

        for (const order of completedOrders) {
            const timeline = await this.getOrderTimeline(order.id);
            durations.push(timeline.total_duration_ms);
        }

        const average_ms = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        return {
            average_ms,
            average_formatted: this.formatDuration(average_ms),
            total_completed: completedOrders.length,
        };
    }

    /**
     * Получить статистику по мастеру
     */
    async getMasterStats(_masterId: string): Promise<{
        total_orders: number;
        completed_orders: number;
        average_completion_time_ms: number;
        average_completion_time_formatted: string;
    }> {
        // This would need order_details to filter by master
        // Simplified version for now
        return {
            total_orders: 0,
            completed_orders: 0,
            average_completion_time_ms: 0,
            average_completion_time_formatted: 'N/A',
        };
    }

    /**
     * Форматирование длительности
     */
    private formatDuration(ms: number): string {
        if (ms < 0) return 'N/A';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}д ${hours % 24}ч`;
        }
        if (hours > 0) {
            return `${hours}ч ${minutes % 60}м`;
        }
        if (minutes > 0) {
            return `${minutes}м ${seconds % 60}с`;
        }
        return `${seconds}с`;
    }

    /**
     * Получить SLA отчёт по периодам
     */
    async generateReport(
        startDate: Date,
        endDate: Date,
    ): Promise<any[]> {
        const reports = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const startOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
            const endOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59);

            const metrics = await this.getSlaMetrics(startOfDay, endOfDay);

            reports.push({
                date: startOfDay.toISOString().split('T')[0],
                total_orders: metrics.total_orders,
                completed_orders: metrics.completed_orders,
                overdue_orders: metrics.overdue_orders,
                on_time_percentage: metrics.on_time_percentage,
            });

            current.setDate(current.getDate() + 1);
        }

        return reports.reverse();
    }
}
