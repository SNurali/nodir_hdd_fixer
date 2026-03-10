"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatMoney } from '@/lib/money';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Wrench, DollarSign,
  UserCheck, MessageSquare, Send, Calendar, User, Phone, Mail,
  Edit2, Save, Trash2, Plus, History, CreditCard, TrendingUp
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

const STATUS_CONFIG = {
  new: { label: 'В ожидании', color: 'purple', badgeBg: 'bg-purple-100 dark:bg-purple-900/30', badgeText: 'text-purple-700 dark:text-purple-300', activeBg: 'bg-purple-600', activeBorder: 'border-purple-600' },
  assigned: { label: 'Назначен', color: 'blue', badgeBg: 'bg-blue-100 dark:bg-blue-900/30', badgeText: 'text-blue-700 dark:text-blue-300', activeBg: 'bg-blue-600', activeBorder: 'border-blue-600' },
  diagnosing: { label: 'Диагностика', color: 'cyan', badgeBg: 'bg-cyan-100 dark:bg-cyan-900/30', badgeText: 'text-cyan-700 dark:text-cyan-300', activeBg: 'bg-cyan-600', activeBorder: 'border-cyan-600' },
  awaiting_approval: { label: 'Ждёт одобрения', color: 'orange', badgeBg: 'bg-orange-100 dark:bg-orange-900/30', badgeText: 'text-orange-700 dark:text-orange-300', activeBg: 'bg-orange-600', activeBorder: 'border-orange-600' },
  approved: { label: 'Одобрен', color: 'green', badgeBg: 'bg-green-100 dark:bg-green-900/30', badgeText: 'text-green-700 dark:text-green-300', activeBg: 'bg-green-600', activeBorder: 'border-green-600' },
  in_repair: { label: 'В ремонте', color: 'yellow', badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30', badgeText: 'text-yellow-700 dark:text-yellow-300', activeBg: 'bg-yellow-600', activeBorder: 'border-yellow-600' },
  ready_for_pickup: { label: 'Готов к выдаче', color: 'emerald', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-300', activeBg: 'bg-emerald-600', activeBorder: 'border-emerald-600' },
  unrepairable: { label: 'Неремонтопригоден', color: 'red', badgeBg: 'bg-red-100 dark:bg-red-900/30', badgeText: 'text-red-700 dark:text-red-300', activeBg: 'bg-red-600', activeBorder: 'border-red-600' },
  issued: { label: 'Выдан', color: 'teal', badgeBg: 'bg-teal-100 dark:bg-teal-900/30', badgeText: 'text-teal-700 dark:text-teal-300', activeBg: 'bg-teal-600', activeBorder: 'border-teal-600' },
  cancelled: { label: 'Отменён', color: 'gray', badgeBg: 'bg-gray-100 dark:bg-gray-900/30', badgeText: 'text-gray-700 dark:text-gray-300', activeBg: 'bg-gray-600', activeBorder: 'border-gray-600' }
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { formatDate, formatDateTime } = useAppSettings();
  
  const [activeTab, setActiveTab] = useState('info');
  const [statusLoading, setStatusLoading] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedMastersByDetail, setSelectedMastersByDetail] = useState<Record<string, string>>({});
  const [assigningDetailId, setAssigningDetailId] = useState('');
  
  const { data: orderData, error, isLoading, mutate } = useSWR(`/orders/${orderId}`, fetcher);
  const order = orderData?.data || orderData;

  const { data: mastersData } = useSWR('/users/masters', fetcher);
  const masters = mastersData?.data || mastersData || [];
  const statusLabel = (status: string) => t(`statuses.${status}`);

  useEffect(() => {
    if (!order?.details || !Array.isArray(order.details)) return;
    setSelectedMastersByDetail((prev) => {
      const next = { ...prev };
      for (const detail of order.details as any[]) {
        if (!next[detail.id]) {
          next[detail.id] = detail.attached_to || '';
        }
      }
      return next;
    });
  }, [order?.details]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t('admin_order_detail.access_denied')}</p>
          <button onClick={() => router.push('/admin/orders')} className="text-blue-500 hover:underline">← {t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(newStatus);
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      setMessage(`✅ ${t('admin_order_detail.status_changed', { status: statusLabel(newStatus) })}`);
      mutate();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || t('admin_order_detail.status_change_error')}`);
    } finally {
      setStatusLoading('');
    }
  };

  const handleAssignMaster = async (detailId: string) => {
    const masterId = selectedMastersByDetail[detailId];
    if (!masterId) {
      setMessage(`❌ ${t('admin_order_detail.select_master_error')}`);
      return;
    }
    setAssigningDetailId(detailId);
    try {
      await api.post(`/orders/${orderId}/details/${detailId}/assign`, { master_id: masterId });
      setMessage(`✅ ${t('admin_order_detail.master_assigned')}`);
      mutate();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || t('admin_order_detail.master_assign_error')}`);
    } finally {
      setAssigningDetailId('');
    }
  };

  const handleAddPayment = async (amount: number, type: string) => {
    setPriceLoading(true);
    try {
      await api.post(`/orders/${orderId}/payments`, {
        payment_type: type,
        paid_amount: amount,
        currency: 'UZS'
      });
      setMessage(`✅ ${t('admin_order_detail.payment_added')}`);
      mutate();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || t('admin_order_detail.payment_add_error')}`);
    } finally {
      setPriceLoading(false);
    }
  };

  const tabs = [
    { id: 'info', label: t('admin_order_detail.tabs.info'), icon: Clock },
    { id: 'lifecycle', label: t('admin_order_detail.tabs.lifecycle'), icon: History },
    { id: 'payments', label: t('admin_order_detail.tabs.payments'), icon: CreditCard },
    { id: 'messages', label: t('admin_order_detail.tabs.messages'), icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/orders')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{t('admin_order_detail.order_title')} #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-gray-500 mt-1">
                {t('admin_order_detail.created_at')} {formatDate(order.order_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full font-medium ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.badgeBg || 'bg-gray-100'} ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.badgeText || 'text-gray-700'}`}>
              {statusLabel(order.status)}
            </span>
          </div>
        </div>

        {message && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <p className="text-green-800 dark:text-green-200">{message}</p>
          </div>
        )}

        {/* Status Management */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wrench size={20} className="text-blue-500" />
            {t('admin_order_detail.status_management')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={statusLoading === key || order.status === key}
                className={`p-3 rounded-xl border-2 transition-all font-medium text-sm ${
                  order.status === key
                    ? `${config.activeBg} text-white ${config.activeBorder}`
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                } disabled:opacity-50`}
              >
                {statusLabel(key)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Client Info */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <User size={20} className="text-blue-500" />
                    {t('admin_order_detail.client_information')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">{t('client.full_name')}</p>
                      <p className="font-medium">{order.client?.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('client.phone')}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone size={16} />
                        {order.client?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('client.email')}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail size={16} />
                        {order.client?.email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('client.telegram')}</p>
                      <p className="font-medium flex items-center gap-2">
                        <MessageSquare size={16} />
                        {order.client?.telegram || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Wrench size={20} className="text-blue-500" />
                    {t('order.order_details')}
                  </h4>
                  <div className="space-y-3">
                    {order.details?.map((detail: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">{t('order.selected_equipment')}</p>
                            <p className="font-medium">{detail.equipment?.name_rus || '—'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('order.selected_issue')}</p>
                            <p className="font-medium">{detail.issue?.name_rus || '—'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('order.price')}</p>
                            <p className="font-bold text-lg">
                              {Number(detail.price) === 0 ? (
                                <span className="text-yellow-600">{t('master_dashboard.price_not_set')}</span>
                              ) : (
                                formatMoney(detail.price, language)
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">{t('order.description')}</p>
                          <p className="text-gray-700 dark:text-gray-300">{detail.description_of_issue || '—'}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-500 mb-2">{t('admin_order_detail.master_assignment_for_item')}</p>
                          <div className="flex flex-col md:flex-row gap-3">
                            <select
                              value={selectedMastersByDetail[detail.id] || ''}
                              onChange={(e) => setSelectedMastersByDetail((prev) => ({ ...prev, [detail.id]: e.target.value }))}
                              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                              disabled={assigningDetailId === detail.id}
                            >
                              <option value="">{t('admin_order_detail.select_master')}</option>
                              {masters.map((master: any) => (
                                <option key={master.id} value={master.id}>
                                  {master.full_name} ({master.phone})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssignMaster(detail.id)}
                              disabled={assigningDetailId === detail.id || !selectedMastersByDetail[detail.id]}
                              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {assigningDetailId === detail.id
                                ? t('admin_order_detail.assigning')
                                : detail.master?.full_name
                                  ? t('admin_order_detail.reassign')
                                  : t('admin_order_detail.assign')}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {t('admin_order_detail.current_master')}: {detail.master?.full_name || t('admin_order_detail.not_assigned')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Info */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-500" />
                    {t('admin_order_detail.financial_information')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">{t('order.total_cost')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatMoney(order.total_price_uzs, language)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('order.total_paid')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatMoney(order.total_paid_uzs, language)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('order.balance_due')}</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatMoney(Number(order.total_price_uzs) - Number(order.total_paid_uzs), language)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lifecycle' && (
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <History size={20} className="text-blue-500" />
                  {t('admin_order_detail.lifecycle_history')}
                </h4>
                <div className="space-y-4">
                  {order.lifecycle?.map((entry: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Clock size={20} className="text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{entry.comments}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatDateTime(entry.created_at)}</span>
                            <span>•</span>
                            <span>{entry.created_by_name || t('admin_order_detail.system')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!order.lifecycle || order.lifecycle.length === 0) && (
                    <p className="text-gray-500 text-center py-8">{t('admin_order_detail.empty_history')}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-green-500" />
                  {t('payment.payment_history')}
                </h4>
                <div className="space-y-4">
                  {order.payments?.map((payment: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <DollarSign size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{t(`payment.payment_type.${payment.payment_type}`)}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(payment.paid_at)}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        +{formatMoney(payment.paid_amount, language, payment.currency || 'UZS')}
                      </p>
                    </div>
                  ))}
                  {(!order.payments || order.payments.length === 0) && (
                    <p className="text-gray-500 text-center py-8">{t('admin_order_detail.no_payments')}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-500" />
                  {t('admin_order_detail.client_messages')}
                </h4>
                <div className="space-y-4 mb-6">
                  {order.messages?.map((msg: any, idx: number) => (
                    <div key={idx} className={`flex ${msg.from_admin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md p-4 rounded-xl ${
                        msg.from_admin
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <p>{msg.text}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!order.messages || order.messages.length === 0) && (
                    <p className="text-gray-500 text-center py-8">{t('admin_order_detail.no_messages')}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('admin_order_detail.message_placeholder')}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  />
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
                    <Send size={20} />
                    {t('common.submit')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
