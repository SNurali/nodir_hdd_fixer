"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { useI18n } from '@/i18n/provider';
import api from '@/lib/api';
import { exportFinancialReportToPDF } from '@/lib/export-pdf';
import { formatMoney } from '@/lib/money';
import useSWR from 'swr';
import {
    ArrowLeft, BarChart3, DollarSign, Package, Users, TrendingUp,
    Download, Calendar, Wrench, CheckCircle2
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ReportsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { language } = useI18n();
    const { formatDate } = useAppSettings();
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const financialReportKey = user
        ? `/payments/reports/financial${dateRange.from || dateRange.to
            ? `?${new URLSearchParams({
                ...(dateRange.from ? { startDate: dateRange.from } : {}),
                ...(dateRange.to ? { endDate: dateRange.to } : {}),
            }).toString()}`
            : ''}`
        : null;

    const { data: stats } = useSWR(user ? '/orders/stats' : null, fetcher);
    const { data: ordersData } = useSWR(user ? '/orders' : null, fetcher);
    const { data: financialReport } = useSWR(financialReportKey, fetcher);
    const orders = ordersData?.data || ordersData || [];

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'operator') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
        return null;
    }

    // Calculate report data
    const allOrders = Array.isArray(orders) ? orders : [];
    const statusCounts: Record<string, number> = {};
    let totalRevenue = 0;
    let paidRevenue = 0;
    const masterStats: Record<string, { name: string; count: number; revenue: number }> = {};

    const filtered = dateRange.from || dateRange.to
        ? allOrders.filter((o: any) => {
            const d = new Date(o.order_date);
            if (dateRange.from && d < new Date(dateRange.from)) return false;
            if (dateRange.to && d > new Date(dateRange.to + 'T23:59:59')) return false;
            return true;
        })
        : allOrders;

    filtered.forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        totalRevenue += Number(o.total_price_uzs || 0);
        paidRevenue += Number(o.total_paid_uzs || 0);
        const masterName = o.details?.[0]?.master?.full_name;
        if (masterName) {
            if (!masterStats[masterName]) masterStats[masterName] = { name: masterName, count: 0, revenue: 0 };
            masterStats[masterName].count++;
            masterStats[masterName].revenue += Number(o.total_price_uzs || 0);
        }
    });

    const STATUS_LABELS: Record<string, string> = {
        new: 'Новый',
        assigned: 'Назначен',
        diagnosing: 'Диагностика',
        awaiting_approval: 'Ожидает одобрения',
        approved: 'Одобрен',
        in_repair: 'В ремонте',
        ready_for_pickup: 'Готов к выдаче',
        unrepairable: 'Неремонтопригоден',
        issued: 'Выдан',
        cancelled: 'Отменён',
    };

    const exportCSV = () => {
        const headers = ['ID', 'Дата', 'Статус', 'Клиент', 'Оборудование', 'Цена', 'Оплачено', 'Мастер'];
        const rows = filtered.map((o: any) => [
            o.id?.slice(0, 8).toUpperCase(),
            formatDate(o.order_date),
            STATUS_LABELS[o.status] || o.status,
            o.client?.full_name || '',
            o.details?.[0]?.equipment?.name_rus || '',
            o.total_price_uzs || 0,
            o.total_paid_uzs || 0,
            o.details?.[0]?.master?.full_name || '',
        ]);

        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = async () => {
        const reportPayload = financialReport?.data || financialReport;
        if (!reportPayload) {
            return;
        }

        await exportFinancialReportToPDF({
            report: reportPayload,
            orders: filtered,
            dateRange,
            language: (user as any)?.preferred_language || 'ru',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 size={28} className="text-blue-500" /> Отчёты
                            </h1>
                            <p className="text-gray-500 mt-1">Аналитика и статистика</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportPDF}
                            disabled={!financialReport}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Download size={20} /> Экспорт PDF
                        </button>
                        <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                            <Download size={20} /> Экспорт CSV
                        </button>
                    </div>
                </div>

                {/* Date filter */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6 flex items-center gap-4">
                    <Calendar size={20} className="text-gray-400" />
                    <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
                    <span className="text-gray-400">—</span>
                    <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
                    {(dateRange.from || dateRange.to) && (
                        <button onClick={() => setDateRange({ from: '', to: '' })} className="text-sm text-blue-500 hover:underline">Сбросить</button>
                    )}
                    <span className="text-sm text-gray-500 ml-auto">Найдено: {filtered.length} заказов</span>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="text-blue-500" size={24} />
                            <span className="text-sm text-gray-500">Всего заказов</span>
                        </div>
                        <p className="text-3xl font-bold">{filtered.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-green-500" size={24} />
                            <span className="text-sm text-gray-500">Общая выручка</span>
                        </div>
                        <p className="text-3xl font-bold">{formatMoney(totalRevenue, language)}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-emerald-500" size={24} />
                            <span className="text-sm text-gray-500">Получено оплат</span>
                        </div>
                        <p className="text-3xl font-bold">{formatMoney(paidRevenue, language)}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-orange-500" size={24} />
                            <span className="text-sm text-gray-500">Задолженность</span>
                        </div>
                        <p className="text-3xl font-bold">{formatMoney(totalRevenue - paidRevenue, language)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status breakdown */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500" /> По статусам
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="text-sm">{STATUS_LABELS[status] || status}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / filtered.length) * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-bold w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Master stats */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" /> По мастерам
                        </h3>
                        <div className="space-y-3">
                            {Object.values(masterStats).sort((a, b) => b.count - a.count).map((m) => (
                                <div key={m.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div>
                                        <span className="font-medium">{m.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">{m.count} заказов</span>
                                    </div>
                                    <span className="font-bold text-green-600">{formatMoney(m.revenue, language)}</span>
                                </div>
                            ))}
                            {Object.keys(masterStats).length === 0 && (
                                <p className="text-center text-gray-400 py-8">Нет данных о мастерах</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
