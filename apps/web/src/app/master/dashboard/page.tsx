"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatMoney } from '@/lib/money';
import {
  Wrench, CheckCircle2, Clock, DollarSign, MessageSquare,
  Loader2, Edit2, Save, XCircle, Hammer, FileText
} from 'lucide-react';
import { filterMasterOrders, getMasterDailyProgress, getNextAssignedOrder } from '@/features/master/dashboard-utils';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function MasterDashboardPage() {
  const { t, language } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const { formatDate } = useAppSettings();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [priceForm, setPriceForm] = useState({ detailId: '', price: '' });
  const [statusForm, setStatusForm] = useState({ detailId: '', status: '', comment: '' });
  const [loading, setLoading] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'assigned'>('all');
  const [hasAutoOpenedAssignment, setHasAutoOpenedAssignment] = useState(false);
  const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, fetcher);
  const rolePreferences = settingsData?.settings?.role_preferences || {};
  const showCompletedJobs = rolePreferences.show_completed_jobs === true;
  const dailyJobTarget = Number(rolePreferences.daily_job_target || 5);
  const autoOpenNextAssignment = rolePreferences.auto_open_next_assignment !== false;

  // Загрузка всех заказов или назначенных
  const { data: ordersData, isLoading, mutate } = useSWR(
    viewMode === 'all' ? '/orders' : '/orders/assigned',
    fetcher
  );
  const rawOrders = ordersData?.data || ordersData || [];
  const orders = filterMasterOrders(rawOrders, showCompletedJobs);
  const dailyProgress = getMasterDailyProgress(rawOrders, dailyJobTarget);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (!autoOpenNextAssignment || !user) {
      return;
    }

    setViewMode('assigned');
  }, [autoOpenNextAssignment, user]);

  React.useEffect(() => {
    if (!autoOpenNextAssignment || hasAutoOpenedAssignment || viewMode !== 'assigned' || selectedOrder || orders.length === 0) {
      return;
    }

    const nextOrder = getNextAssignedOrder(orders);
    if (nextOrder) {
      setSelectedOrder(nextOrder);
      setHasAutoOpenedAssignment(true);
    }
  }, [autoOpenNextAssignment, hasAutoOpenedAssignment, orders, selectedOrder, viewMode]);

  React.useEffect(() => {
    if (selectedOrder && !orders.some((order: any) => order.id === selectedOrder.id)) {
      setSelectedOrder(null);
    }
  }, [orders, selectedOrder]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSetPrice = async (orderId: string, detailId: string, orderStatus: string) => {
    setLoading('price');
    try {
      const statusForSetPrice = ['assigned', 'diagnosing', 'awaiting_approval', 'approved'];
      const statusForUpdatePrice = ['in_repair', 'ready_for_pickup'];

      let endpoint = '/set-price';
      if (statusForUpdatePrice.includes(orderStatus)) {
        endpoint = '/update-price';
      } else if (!statusForSetPrice.includes(orderStatus)) {
        alert(`❌ ${t('master_dashboard.set_price_hint')}`);
        setLoading('');
        return;
      }

      await api.post(`/orders/${orderId}${endpoint}`, {
        details: [{ detail_id: detailId, price: parseFloat(priceForm.price) }]
      });
      setPriceForm({ detailId: '', price: '' });
      mutate();
      alert(`✅ ${t('master_dashboard.price_set_success')}`);
    } catch (err: any) {
      alert(`❌ ${t('common.error')}: ` + (err.response?.data?.message || t('master_dashboard.price_set_error')));
    } finally {
      setLoading('');
    }
  };

  const handleSetStatus = async (orderId: string, detailId: string) => {
    setLoading('status');
    try {
      const payload: { is_completed: number; comments?: string } = {
        is_completed: statusForm.status === 'ready_for_pickup' ? 1 : statusForm.status === 'unrepairable' ? 2 : 1,
      };
      if (statusForm.comment) {
        payload.comments = statusForm.comment;
      }
      await api.post(`/orders/${orderId}/details/${detailId}/complete`, payload);
      setStatusForm({ detailId: '', status: '', comment: '' });
      mutate();
      alert(`✅ ${t('master_dashboard.status_updated_success')}`);
    } catch (err: any) {
      alert(`❌ ${t('common.error')}: ` + (err.response?.data?.message || t('master_dashboard.status_updated_error')));
    } finally {
      setLoading('');
    }
  };

  const handleReturnEquipment = async (orderId: string, detailId: string) => {
    if (!confirm(t('master_dashboard.return_confirm'))) return;
    
    setLoading('return');
    try {
      await api.post(`/orders/${orderId}/details/${detailId}/return`);
      mutate();
      alert(`✅ ${t('master_dashboard.return_success')}`);
    } catch (err: any) {
      alert(`❌ ${t('common.error')}: ` + (err.response?.data?.message || t('master_dashboard.return_error')));
    } finally {
      setLoading('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">{t('master_dashboard.loading_orders')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔧 {t('master_dashboard.title')}</h1>
            <p className="text-gray-500">{t('master_dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t('master_dashboard.all_orders')}
              </button>
              <button
                onClick={() => setViewMode('assigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t('master_dashboard.my_orders')}
              </button>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              ← {t('master_dashboard.back_home')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('master_dashboard.total_orders')}</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('master_dashboard.in_progress')}</p>
                <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'in_repair').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('master_dashboard.completed')}</p>
                <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'ready_for_pickup').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('master_dashboard.total_amount')}</p>
                <p className="text-xl font-bold">{formatMoney(orders.reduce((sum: number, o: any) => sum + (Number(o.total_price_uzs) || 0), 0), language)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <CheckCircle2 className="text-cyan-600" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{t('master_dashboard.daily_plan')}</p>
                <p className="text-2xl font-bold">{dailyProgress.completedToday}/{dailyProgress.target}</p>
                <p className="text-xs text-gray-500">{t('master_dashboard.remaining')}: {dailyProgress.remaining}</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: `${dailyProgress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Orders Table - Same as main dashboard */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-bold">📋 {viewMode === 'all' ? t('master_dashboard.all_orders') : t('master_dashboard.my_orders')}</h2>
            <span className="text-sm text-gray-500">{t('master_dashboard.orders_count', { count: String(orders.length) })}</span>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Hammer size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('master_dashboard.no_orders')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.order_id')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.client')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.status')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.price')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.date')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{t('master_dashboard.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {orders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-blue-400 hover:underline">
                        {order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {order.client?.full_name || t('master_dashboard.anonymous')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
                          order.status === 'new' ? 'text-purple-600 bg-purple-100 border-purple-200' :
                          order.status === 'assigned' ? 'text-blue-600 bg-blue-100 border-blue-200' :
                          order.status === 'in_repair' ? 'text-yellow-600 bg-yellow-100 border-yellow-200' :
                          order.status === 'ready_for_pickup' ? 'text-green-600 bg-green-100 border-green-200' :
                          'text-gray-600 bg-gray-100 border-gray-200'
                        }`}>
                          {t(`statuses.${order.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {Number(order.total_price_uzs) === 0 ? (
                          <span className="text-yellow-600">⏳ {t('master_dashboard.price_not_set')}</span>
                        ) : (
                          formatMoney(order.total_price_uzs, language)
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Wrench size={18} className="text-gray-400 hover:text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="text-2xl font-bold">Заказ #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">👤 {t('master_dashboard.client_info')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('master_dashboard.full_name')}</p>
                      <p className="font-medium">{selectedOrder.client?.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('master_dashboard.phone')}</p>
                      <p className="font-medium">{selectedOrder.client?.phone || '—'}</p>
                    </div>
                    {selectedOrder.client?.email && (
                      <div>
                        <p className="text-sm text-gray-500">{t('master_dashboard.email')}</p>
                        <p className="font-medium">{selectedOrder.client.email}</p>
                      </div>
                    )}
                    {selectedOrder.client?.telegram && (
                      <div>
                        <p className="text-sm text-gray-500">{t('master_dashboard.telegram')}</p>
                        <p className="font-medium">{selectedOrder.client.telegram}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h3 className="text-lg font-bold mb-4">📦 {t('master_dashboard.order_details')}</h3>
                  <div className="space-y-4">
                    {selectedOrder.details?.map((detail: any) => (
                      <div key={detail.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="font-bold text-lg mb-2">
                              {detail.equipment?.name_rus} - {detail.issue?.name_rus}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">{detail.description_of_issue || t('master_dashboard.no_description')}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-500">{t('master_dashboard.price')}</p>
                            <p className="text-2xl font-bold">
                              {Number(detail.price) > 0 ? formatMoney(detail.price, language) : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200 dark:border-gray-700">
                          {/* Set Price */}
                          {Number(detail.price) === 0 && (
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                placeholder={t('master_dashboard.price')}
                                value={priceForm.detailId === detail.id ? priceForm.price : ''}
                                onChange={(e) => setPriceForm({ detailId: detail.id, price: e.target.value })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 w-32"
                              />
                              <button
                                onClick={() => handleSetPrice(selectedOrder.id, detail.id, selectedOrder.status)}
                                disabled={loading === 'price' || !priceForm.price}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                {loading === 'price' ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                                {t('master_dashboard.set_price')}
                              </button>
                            </div>
                          )}

                          {/* Set Status */}
                          <div className="flex gap-2 items-center">
                            <select
                              value={statusForm.detailId === detail.id ? statusForm.status : ''}
                              onChange={(e) => setStatusForm({ ...statusForm, detailId: detail.id, status: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
                            >
                              <option value="">{t('master_dashboard.status_placeholder')}</option>
                              <option value="diagnosing">Диагностика</option>
                              <option value="awaiting_approval">{t('master_dashboard.awaiting_approval')}</option>
                              <option value="approved">{t('master_dashboard.approved')}</option>
                              <option value="in_repair">{t('master_dashboard.in_repair_status')}</option>
                              <option value="ready_for_pickup">{t('master_dashboard.ready_for_pickup')}</option>
                              <option value="unrepairable">{t('master_dashboard.unrepairable')}</option>
                            </select>
                            <input
                              type="text"
                              placeholder={t('master_dashboard.comment_placeholder')}
                              value={statusForm.detailId === detail.id ? statusForm.comment : ''}
                              onChange={(e) => setStatusForm({ ...statusForm, detailId: detail.id, comment: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 flex-1 min-w-[150px]"
                            />
                            <button
                              onClick={() => handleSetStatus(selectedOrder.id, detail.id)}
                              disabled={loading === 'status' || !statusForm.status}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {loading === 'status' ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                              {t('master_dashboard.update')}
                            </button>
                          </div>

                          {/* Return Equipment */}
                          {detail.is_completed === 1 && (
                            <button
                              onClick={() => handleReturnEquipment(selectedOrder.id, detail.id)}
                              disabled={loading === 'return'}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {loading === 'return' ? <Loader2 className="animate-spin" size={16} /> : <Wrench size={16} />}
                              {t('master_dashboard.return_equipment')}
                            </button>
                          )}
                        </div>

                        {/* Work Description */}
                        {detail.comments && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 mb-2">{t('master_dashboard.work_done')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{detail.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
