"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { useI18n } from '@/i18n/provider';
import api from '@/lib/api';
import useSWR from 'swr';
import {
    Package, Clock, CheckCircle2, XCircle, Wrench, LogOut, DollarSign, ArrowRight, Search
} from 'lucide-react';
import { formatClientPriceDisplay } from '@/features/client/price-utils';

const fetcher = (url: string) => api.get(url).then(res => res.data);

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: 'Ожидает', color: 'bg-purple-100 text-purple-700', icon: Clock },
    assigned: { label: 'Назначен', color: 'bg-blue-100 text-blue-700', icon: Wrench },
    diagnosing: { label: 'Диагностика', color: 'bg-cyan-100 text-cyan-700', icon: Search },
    awaiting_approval: { label: 'Ждёт одобрения', color: 'bg-orange-100 text-orange-700', icon: DollarSign },
    approved: { label: 'Одобрен', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    in_repair: { label: 'В ремонте', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
    ready_for_pickup: { label: 'Готов к выдаче', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    issued: { label: 'Выдан', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    unrepairable: { label: 'Неремонтопригоден', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'Отменён', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function ClientDashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, logout } = useAuth();
    const { formatDate } = useAppSettings();
    const { t } = useI18n();

    const { data: ordersData, isLoading } = useSWR(user ? '/orders/my' : null, fetcher);
    const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, fetcher);
    const orders = ordersData?.data || ordersData || [];
    const showPricesInUsd = settingsData?.settings?.role_preferences?.show_prices_in_usd === true;

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeOrders = orders.filter((o: any) => !['issued', 'cancelled'].includes(o.status));
    const completedOrders = orders.filter((o: any) => ['issued', 'cancelled'].includes(o.status));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Мои заказы</h1>
                        <p className="text-gray-500 mt-1">Добро пожаловать, {user.full_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/profile')} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {user.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        </button>
                        <button onClick={logout} className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors" title="Выйти">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                        <Package className="mx-auto mb-2 text-blue-500" size={28} />
                        <p className="text-2xl font-bold">{orders.length}</p>
                        <p className="text-sm text-gray-500">Всего</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                        <Wrench className="mx-auto mb-2 text-yellow-500" size={28} />
                        <p className="text-2xl font-bold">{activeOrders.length}</p>
                        <p className="text-sm text-gray-500">В работе</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                        <CheckCircle2 className="mx-auto mb-2 text-green-500" size={28} />
                        <p className="text-2xl font-bold">{completedOrders.length}</p>
                        <p className="text-sm text-gray-500">Завершено</p>
                    </div>
                </div>

                {/* Active orders */}
                {activeOrders.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Wrench size={20} className="text-blue-500" />
                            Активные заказы
                        </h2>
                        <div className="space-y-4">
                            {activeOrders.map((order: any) => {
                                const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;
                                const Icon = st.icon;
                                return (
                                    <div key={order.id}
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 cursor-pointer hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-mono text-blue-500 font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-sm text-gray-500 mt-1">{formatDate(order.order_date)}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.color}`}>
                                                <Icon size={12} className="inline mr-1" />{st.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-gray-500">
                                                {order.details?.[0]?.equipment?.name_rus || 'Оборудование'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {Number(order.total_price_uzs) > 0 ? (
                                                    <span className="font-bold">{formatClientPriceDisplay(order.total_price_uzs, order.currency_rate_usd, showPricesInUsd)}</span>
                                                ) : (
                                                    <span className="text-yellow-600 text-sm">Цена не установлена</span>
                                                )}
                                                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Completed orders */}
                {completedOrders.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-500" />
                            Завершённые заказы
                        </h2>
                        <div className="space-y-3">
                            {completedOrders.map((order: any) => {
                                const st = STATUS_LABELS[order.status] || STATUS_LABELS.issued;
                                return (
                                    <div key={order.id}
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-sm mt-1">{order.details?.[0]?.equipment?.name_rus || 'Оборудование'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${st.color}`}>{st.label}</span>
                                            {Number(order.total_price_uzs) > 0 && (
                                                <p className="text-sm font-bold mt-1">{formatClientPriceDisplay(order.total_price_uzs, order.currency_rate_usd, showPricesInUsd)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {orders.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <Package size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xl font-bold text-gray-400">У вас пока нет заказов</p>
                    </div>
                )}
            </div>
        </div>
    );
}
