"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatCompactMoney, formatMoney } from '@/lib/money';
import { 
  Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, 
  Clock, User, Wrench, DollarSign, Calendar, Phone, MessageSquare,
  MoreVertical, ChevronDown, RefreshCw
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

const STATUS_CONFIG = {
  new: { label: 'В ожидании', color: 'purple', bg: 'bg-purple-100 text-purple-700' },
  assigned: { label: 'Назначен', color: 'blue', bg: 'bg-blue-100 text-blue-700' },
  diagnosing: { label: 'Диагностика', color: 'cyan', bg: 'bg-cyan-100 text-cyan-700' },
  awaiting_approval: { label: 'Ждёт одобрения', color: 'orange', bg: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Одобрен', color: 'green', bg: 'bg-green-100 text-green-700' },
  in_repair: { label: 'В ремонте', color: 'yellow', bg: 'bg-yellow-100 text-yellow-700' },
  ready_for_pickup: { label: 'Готов к выдаче', color: 'emerald', bg: 'bg-emerald-100 text-emerald-700' },
  unrepairable: { label: 'Неремонтопригоден', color: 'red', bg: 'bg-red-100 text-red-700' },
  issued: { label: 'Выдан', color: 'teal', bg: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Отменён', color: 'gray', bg: 'bg-gray-100 text-gray-700' }
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useAuth();
  const { formatDate } = useAppSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  const { data: ordersData, isLoading, error, mutate } = useSWR('/orders', fetcher);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const orders = ordersData?.data || ordersData || [];

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'new').length,
    inProgress: orders.filter((o: any) => o.status === 'in_repair').length,
    ready_for_pickup: orders.filter((o: any) => o.status === 'ready_for_pickup').length,
    revenue: orders.reduce((sum: number, o: any) => sum + (Number(o.total_price_uzs) || 0), 0)
  };

  const statusLabel = (status: string) => t(`statuses.${status}`);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t('admin_orders.access_denied')}</p>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">← {t('admin_orders.home_back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HDD FIXER</h1>
              <span className="text-sm text-gray-500">{t('admin_orders.admin_panel')}</span>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="text-sm border rounded-lg px-3 py-1.5 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="uz-cyr">UZ (Cyr)</option>
                <option value="uz-lat">UZ (Lot)</option>
              </select>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_orders.total_orders')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_orders.pending')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wrench className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_orders.in_progress')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_orders.completed')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ready_for_pickup}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_orders.revenue')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCompactMoney(stats.revenue, language)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('admin_orders.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              >
                <option value="all">{t('admin_orders.all_statuses')}</option>
                {Object.keys(STATUS_CONFIG).map((key) => (
                  <option key={key} value={key}>{statusLabel(key)}</option>
                ))}
              </select>
              
              <button
                onClick={() => mutate()}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={() => router.push('/orders/new')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                {t('admin_orders.new_order')}
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.client')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.status')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.equipment')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.price')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.date')}</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_orders.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 font-medium">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.client?.full_name || t('common.anonymous')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.client?.phone || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.bg || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {order.details?.[0]?.equipment?.name_rus || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {Number(order.total_price_uzs) === 0 ? (
                            <span className="text-yellow-600">—</span>
                          ) : (
                            formatMoney(order.total_price_uzs, language)
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('order.total_paid')}: {formatMoney(order.total_paid_uzs, language)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t('admin_orders.more_actions')}
                        >
                          <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400 dark:text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">{t('admin_orders.no_orders')}</p>
                        <p className="text-sm">{t('admin_orders.no_orders_hint')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
