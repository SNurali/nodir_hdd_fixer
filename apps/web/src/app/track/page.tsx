"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useAppSettings } from '@/app/app-settings-provider';
import { useAuth } from '@/app/auth-provider';
import api from '@/lib/api';
import { Search, Clock, CheckCircle2, XCircle, Wrench, Package } from 'lucide-react';
import useSWR from 'swr';
import { formatClientPriceDisplay } from '@/features/client/price-utils';

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
    new: { label: 'Ожидает', color: 'bg-purple-100 text-purple-700 border-purple-200', description: 'Ваш заказ зарегистрирован и ожидает обработки.' },
    assigned: { label: 'Назначен', color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'Мастер назначен на заказ.' },
    diagnosing: { label: 'Диагностика', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', description: 'Мастер проводит диагностику и оценку стоимости.' },
    awaiting_approval: { label: 'Ждёт одобрения', color: 'bg-orange-100 text-orange-700 border-orange-200', description: 'Ожидаем подтверждения цены от клиента.' },
    approved: { label: 'Одобрено', color: 'bg-green-100 text-green-700 border-green-200', description: 'Клиент одобрил цену, заказ готов к ремонту.' },
    in_repair: { label: 'В ремонте', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: 'Мастер выполняет ремонт вашего устройства.' },
    ready_for_pickup: { label: 'Готов к выдаче', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', description: 'Ремонт выполнен. Ожидается оплата и выдача.' },
    issued: { label: 'Выдан', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', description: 'Оборудование возвращено клиенту. Заказ закрыт.' },
    unrepairable: { label: 'Неремонтопригоден', color: 'bg-red-100 text-red-700 border-red-200', description: 'К сожалению, ремонт невозможен.' },
    cancelled: { label: 'Отменён', color: 'bg-gray-100 text-gray-700 border-gray-200', description: 'Заказ был отменён.' },
};

const STATUS_ORDER = ['new', 'assigned', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup', 'issued'];

export default function TrackOrderPage() {
    const { formatDate } = useAppSettings();
    const { user } = useAuth();
    const [token, setToken] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPrefilled, setIsPrefilled] = useState(false);
    const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, (url: string) => api.get(url).then((res) => res.data), {
        shouldRetryOnError: false,
    });
    const showPricesInUsd = settingsData?.settings?.role_preferences?.show_prices_in_usd === true;

    const handleTrack = useCallback(async () => {
        if (!token.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);
        try {
            const { data } = await api.get(`/orders/track/${token.trim()}`);
            setOrder(data.data || data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Заказ не найден. Проверьте код отслеживания.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const nextToken = new URLSearchParams(window.location.search).get('token');
        if (!nextToken || isPrefilled) {
            return;
        }

        setToken(nextToken);
        setIsPrefilled(true);
    }, [isPrefilled]);

    useEffect(() => {
        if (token && isPrefilled) {
            void handleTrack();
        }
    }, [handleTrack, isPrefilled, token]);

    const getProgressSteps = (currentStatus: string) => {
        const currentIdx = STATUS_ORDER.indexOf(currentStatus);
        return STATUS_ORDER.map((status, idx) => ({
            status,
            label: STATUS_LABELS[status]?.label || status,
            active: idx <= currentIdx,
            current: idx === currentIdx,
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Wrench className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tight">HDD FIXER</h1>
                    <p className="text-gray-500 mt-2">Отслеживание статуса заказа</p>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl mb-6">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                            placeholder="Введите код отслеживания"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono tracking-widest"
                        />
                        <button
                            onClick={handleTrack}
                            disabled={loading || !token.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Search size={20} />
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <XCircle className="mx-auto mb-3 text-red-500" size={48} />
                        <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {/* Order result */}
                {order && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Заказ</p>
                                <p className="text-xl font-mono font-bold text-blue-600">#{order.id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                                {STATUS_LABELS[order.status]?.label || order.status}
                            </span>
                        </div>

                        {/* Progress steps */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                {getProgressSteps(order.status).map((step, idx) => (
                                    <div key={step.status} className="flex items-center flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.current ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                                                step.active ? 'bg-green-500 text-white' :
                                                    'bg-gray-200 text-gray-400'
                                            }`}>
                                            {step.active ? '✓' : idx + 1}
                                        </div>
                                        {idx < STATUS_ORDER.length - 1 && (
                                            <div className={`flex-1 h-1 mx-1 rounded ${step.active ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                                {STATUS_LABELS[order.status]?.description || 'Статус заказа обновляется.'}
                            </p>
                        </div>

                        {/* Order info */}
                        <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Дата создания</span>
                                <span className="font-medium">{formatDate(order.order_date || order.created_at)}</span>
                            </div>
                            {Number(order.total_price_uzs) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Стоимость</span>
                                    <span className="font-bold text-lg">{formatClientPriceDisplay(order.total_price_uzs, order.currency_rate_usd, showPricesInUsd)}</span>
                                </div>
                            )}
                            {order.details?.[0]?.equipment?.name_rus && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Оборудование</span>
                                    <span className="font-medium">{order.details[0].equipment.name_rus}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
