"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { ORDERS_PER_PAGE, STATUS_FILTERS } from '../constants';
import { extractOrders, getStatusColor } from '../utils';
import { getOrderRefreshInterval, sortOrdersForQueue } from '../role-preferences';
import { formatClientPriceDisplay } from '@/features/client/price-utils';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function DashboardOrderTable({ theme }: { theme: 'light' | 'dark' }) {
  const { t } = useI18n();
  const { formatDate } = useAppSettings();
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const isClient = user?.role === 'client';
  const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, fetcher);
  const rolePreferences = settingsData?.settings?.role_preferences || {};
  const endpoint = isClient ? '/orders/my' : '/orders';
  const { data: ordersData, error, isLoading } = useSWR(endpoint, fetcher, {
    refreshInterval: getOrderRefreshInterval(user?.role, rolePreferences.auto_refresh_seconds),
  });
  const allOrders = extractOrders(ordersData);
  const queueMode = user?.role === 'operator'
    ? rolePreferences.queue_sort || 'new_first'
    : 'new_first';
  const orderedOrders = user?.role === 'operator'
    ? sortOrdersForQueue(allOrders, queueMode)
    : allOrders;
  const showPricesInUsd = isClient && rolePreferences.show_prices_in_usd === true;

  const filteredOrders = statusFilter === 'all'
    ? orderedOrders
    : orderedOrders.filter((o: any) => o.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const orders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (isLoading) {
    return <div className={`p-10 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className={`p-10 text-center rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('dashboard.no_orders')}
        </div>
        <div className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('dashboard.connection_hint')}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${theme === 'dark'
      ? 'bg-gray-900/50 border-gray-800'
      : 'bg-white border-gray-200 shadow-lg'
      }`}>
      <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Filter size={18} className="inline mr-2" />
            {t('dashboard.recent_orders')}
            <span className={`ml-2 text-sm font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              ({filteredOrders.length})
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const count = filter.key === 'all' ? allOrders.length : allOrders.filter((o: any) => o.status === filter.key).length;
            const isActive = statusFilter === filter.key;

            return (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-blue-600 text-white border-blue-600'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                {t(filter.translationKey)} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-200'} border-b`}>
              <th className="px-6 py-4 font-medium">{t('order.order_id')}</th>
              <th className="px-6 py-4 font-medium">{t('order.client')}</th>
              <th className="px-6 py-4 font-medium">{t('order.status')}</th>
              <th className="px-6 py-4 font-medium">{t('order.price')}</th>
              <th className="px-6 py-4 font-medium">{t('order.date')}</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {(orders || []).map((order: any, index: number) => (
              <tr
                key={index}
                className={`transition-colors group cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <td className="px-6 py-4 text-sm font-mono text-blue-400 group-hover:underline">
                  {order?.id ? String(order.id).slice(0, 8).toUpperCase() : 'UNKNOWN'}
                </td>
                <td className={`px-6 py-4 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                  {order.client?.full_name || t('common.anonymous')}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(theme, order.status)}`}>
                    {t(`statuses.${order.status}`)}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Number(order.total_price_uzs) === 0
                    ? (
                      <span className="flex items-center gap-2">
                        <span className="text-yellow-500">⏳</span>
                        <span className="text-yellow-600 text-xs">
                          {user?.role === 'client' ? t('dashboard.price_pending_client') : t('dashboard.price_pending_staff')}
                        </span>
                      </span>
                    )
                    : formatClientPriceDisplay(order.total_price_uzs, order.currency_rate_usd, showPricesInUsd)}
                </td>
                <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDate(order.order_date)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className={`px-6 py-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {statusFilter !== 'all'
                    ? t('dashboard.no_orders_with_status', {
                        status: t(STATUS_FILTERS.find((filter) => filter.key === statusFilter)?.translationKey || 'dashboard.filter_all'),
                      })
                    : t('dashboard.no_recent_orders')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`px-6 py-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('dashboard.page_of', { current: String(currentPage), total: String(totalPages) })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
