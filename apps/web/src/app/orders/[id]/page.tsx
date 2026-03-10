"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { useAuth } from '@/app/auth-provider';
import { useTheme } from '@/components/theme-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import { socketService } from '@/lib/socket';
import { exportOrderToPDF } from '@/lib/export-pdf';
import { formatMoney } from '@/lib/money';
import { ArrowLeft, MessageSquare, UserCheck, Send, Loader2, History, User, Phone, Mail, Globe } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';
import { OrderStatusHint } from '@/components/order-status-hint';
import { OrderWorkflowGuide } from '@/components/order-workflow-guide';
import { STATUS_CONFIG } from '@/features/orders/detail/constants';
import type { OrderStatus, PaymentMethod, PaymentRow } from '@/features/orders/detail/types';
import { normalizePaymentMethod, paymentMethodLabel } from '@/features/orders/detail/utils';
import { StatusBadge } from '@/features/orders/detail/components/status-badge';
import { OrderSummaryCard } from '@/features/orders/detail/components/order-summary-card';
import { OrderWorkDetailsCard } from '@/features/orders/detail/components/order-work-details-card';
import { OrderPaymentsCard } from '@/features/orders/detail/components/order-payments-card';
import { OrderStatusManagementCard } from '@/features/orders/detail/components/order-status-management-card';
import { OrderPriceApprovalCard } from '@/features/orders/detail/components/order-price-approval-card';
import { OrderPricingCard } from '@/features/orders/detail/components/order-pricing-card';
import { OrderPriceHistoryCard } from '@/features/orders/detail/components/order-price-history-card';
import { OrderChatCard } from '@/features/orders/detail/components/order-chat-card';
import { OrderClientContactsCard } from '@/features/orders/detail/components/order-client-contacts-card';
import { OrderStatusDocsCard } from '@/features/orders/detail/components/order-status-docs-card';
import { OrderLifecycleCard } from '@/features/orders/detail/components/order-lifecycle-card';
import { OrderMasterAssignmentCard } from '@/features/orders/detail/components/order-master-assignment-card';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { t, language } = useI18n();
  const { formatDate } = useAppSettings();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pricesForm, setPricesForm] = useState<Record<string, string>>({});
  const [settingPrice, setSettingPrice] = useState(false);
  const [priceHistoryData, setPriceHistoryData] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [updatePriceForm, setUpdatePriceForm] = useState({ amount: '', reason: '' });
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  const [selectedMastersByDetail, setSelectedMastersByDetail] = useState<Record<string, string>>({});
  const [assigningDetailId, setAssigningDetailId] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [completingDetail, setCompletingDetail] = useState('');
  const [splitPaymentMode, setSplitPaymentMode] = useState(false);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([{ amount: '', method: 'CASH' }]);
  const [paymentNote, setPaymentNote] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentInputWarning, setPaymentInputWarning] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState('');
  const [editingPaymentForm, setEditingPaymentForm] = useState<{ amount: string; method: PaymentMethod }>({
    amount: '',
    method: 'CASH',
  });
  const [updatingPaymentId, setUpdatingPaymentId] = useState('');
  const [statusComment, setStatusComment] = useState('');

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isMaster = user?.role === 'master';
  const isClient = user?.role === 'client';

  const canRequestProtectedData = Boolean(user?.id && orderId);

  const { data: orderData, error, isLoading, mutate } = useSWR(
    canRequestProtectedData ? `/orders/${orderId}` : null,
    fetcher
  );
  const order = orderData?.data || orderData;

  // Получаем допустимые переходы
  const { data: transitionsData } = useSWR(
    canRequestProtectedData ? `/orders/${orderId}/allowed-transitions` : null,
    fetcher
  );
  const allowedTransitions = transitionsData?.transitions || [];

  const { data: lifecycleData } = useSWR(
    canRequestProtectedData ? `/orders/${orderId}/lifecycle` : null,
    fetcher
  );
  const lifecycle = lifecycleData || [];

  const { data: mastersData } = useSWR(
    canRequestProtectedData ? '/users/masters' : null,
    fetcher
  );
  const mastersList = mastersData?.data || mastersData || [];

  const { data: settingsData } = useSWR(
    user ? '/users/me/settings' : null,
    fetcher
  );

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    user ? `/orders/${orderId}/messages` : null,
    fetcher,
    { refreshInterval: 5000 }
  );
  const messagesList = messagesData?.data || messagesData || [];

  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messagesList]);

  React.useEffect(() => {
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

  // WebSocket connection effect
  React.useEffect(() => {
    if (user?.id && orderId) {
      // Connect to WebSocket
      socketService.connect(user.id);

      // Join order room
      socketService.joinOrderRoom(orderId);

      // Listen for order updates
      const handleOrderUpdate = (data: any) => {
        if (data.orderId === orderId) {
          mutate();
        }
      };

      // Listen for notifications
      const handleNotification = (_data: any) => {
        mutateMessages();
      };

      socketService.onOrderUpdate(handleOrderUpdate);
      socketService.onNotification(handleNotification);

      // Cleanup
      return () => {
        socketService.offOrderUpdate(handleOrderUpdate);
        socketService.offNotification(handleNotification);
        socketService.leaveOrderRoom(orderId);
      };
    }
  }, [user?.id, orderId, mutate, mutateMessages]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  if (authLoading || !isMounted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Заказ не найден</p>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">← Назад</button>
        </div>
      </div>
    );
  }

  const requireStatusComment = Boolean(settingsData?.settings?.role_preferences?.require_status_comment);

  const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
    const trimmedReason = String(reason || '').trim();
    if (requireStatusComment && !trimmedReason) {
      setMessage('❌ Ошибка: комментарий обязателен при смене статуса');
      return;
    }
    if (!confirm(`Изменить статус на "${STATUS_CONFIG[newStatus].label}"?`)) return;
    setActionLoading(newStatus);
    try {
      await api.patch(`/orders/${orderId}`, {
        status: newStatus,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });
      setMessage(`✅ Статус изменён на "${STATUS_CONFIG[newStatus].label}"`);
      setStatusComment('');
      mutate();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.missingRequirements && Array.isArray(data.missingRequirements)) {
        setMessage(`❌ Ошибка: ${data.message}. Не хватает: ${data.missingRequirements.join(', ')}`);
      } else {
        setMessage('❌ Ошибка: ' + (data?.message || 'Не удалось изменить статус'));
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleApprovePrice = async () => {
    if (!confirm('Вы уверены, что хотите одобрить эту цену?')) return;
    setActionLoading('approve_price');
    try {
      await api.post(`/orders/${orderId}/approve-price`);
      setMessage('✅ Цена одобрена! Мастер приступит к работе.');
      mutate();
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось одобрить цену'));
    } finally {
      setActionLoading('');
    }
  };

  const handleRejectPrice = async () => {
    const reason = prompt('Укажите причину отклонения:');
    if (!reason) return;
    setActionLoading('reject_price');
    try {
      await api.post(`/orders/${orderId}/reject-price`, { reason });
      setMessage('❌ Цена отклонена. Администратор уведомлён.');
      mutate();
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось отклонить цену'));
    } finally {
      setActionLoading('');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    try {
      await api.post(`/orders/${orderId}/messages`, { text: messageText.trim() });
      setMessageText('');
      mutateMessages();
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось отправить сообщение'));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSetPrice = async () => {
    const detailsPayload = order.details
      ?.filter((d: any) => pricesForm[d.id] && Number(pricesForm[d.id]) > 0)
      .map((d: any) => ({
        detail_id: d.id,
        price: Number(pricesForm[d.id])
      })) || [];

    if (detailsPayload.length === 0) {
      setMessage('❌ Введите корректную сумму хотя бы для одной позиции');
      return;
    }

    setSettingPrice(true);
    try {
      const statusForSetPrice = ['assigned', 'diagnosing', 'awaiting_approval', 'approved'];
      const statusForUpdatePrice = ['in_repair', 'ready_for_pickup'];

      let endpoint = '/set-price';
      if (statusForUpdatePrice.includes(String(order?.status))) {
        endpoint = '/update-price';
      } else if (!statusForSetPrice.includes(String(order?.status))) {
        setMessage('❌ Для установки цены сначала назначьте мастера и начните диагностику');
        setSettingPrice(false);
        return;
      }

      await api.post(`/orders/${orderId}${endpoint}`, {
        details: detailsPayload
      });
      setMessage('✅ Цены установлены!');
      setPricesForm({});
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось установить цену'));
    } finally {
      setSettingPrice(false);
    }
  };

  const handleUpdatePrice = async (adjustment: 'add' | 'subtract') => {
    const amount = Number(updatePriceForm.amount);
    if (!amount || amount <= 0) {
      setMessage('❌ Введите корректную сумму');
      return;
    }
    if (!updatePriceForm.reason.trim()) {
      setMessage('❌ Укажите причину изменения цены');
      return;
    }

    setUpdatingPrice(true);
    try {
      const currentPrice = Number(order.total_price_uzs) || 0;
      const newPrice = adjustment === 'add'
        ? currentPrice + amount
        : Math.max(0, currentPrice - amount);

      await api.post(`/orders/${orderId}/update-total-price`, {
        new_price: newPrice,
        reason: `${adjustment === 'add' ? 'Добавлено' : 'Снято'}: ${updatePriceForm.reason.trim()}`
      });

      setMessage(`✅ Цена ${adjustment === 'add' ? 'увеличена' : 'уменьшена'} на ${formatMoney(amount, language)}`);
      setUpdatePriceForm({ amount: '', reason: '' });
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось изменить цену'));
    } finally {
      setUpdatingPrice(false);
    }
  };

  const fetchPriceHistory = async () => {
    setLoadingPriceHistory(true);
    try {
      const { data } = await api.get(`/orders/${orderId}/price-history`);
      setPriceHistoryData(data || []);
      setShowPriceHistory(true);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось загрузить историю цен'));
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const handleAssignMaster = async (detailId: string) => {
    const selectedMasterId = selectedMastersByDetail[detailId];
    if (!selectedMasterId) {
      setMessage('❌ Выберите мастера');
      return;
    }
    setAssigningDetailId(detailId);
    try {
      await api.post(`/orders/${orderId}/details/${detailId}/assign`, { master_id: selectedMasterId });
      setMessage('✅ Мастер назначен для позиции');
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось назначить мастера'));
    } finally {
      setAssigningDetailId('');
    }
  };

  const handleCompleteDetail = async (detailId: string) => {
    if (!confirm('Отметить работу как выполненную?')) return;
    setCompletingDetail(detailId);
    try {
      await api.post(`/orders/${orderId}/details/${detailId}/complete`, { is_completed: 1, comments: '' });
      setMessage('✅ Работа отмечена как выполненная!');
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось отметить'));
    } finally {
      setCompletingDetail('');
    }
  };

  const addPaymentRow = () => {
    setPaymentInputWarning('');
    setPaymentRows((prev) => [...prev, { amount: '', method: 'UZCARD' }]);
  };

  const removePaymentRow = (index: number) => {
    setPaymentInputWarning('');
    setPaymentRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updatePaymentRow = (index: number, patch: Partial<PaymentRow>) => {
    setPaymentRows((prev) => {
      // Auto-cap row amount so total never exceeds remaining order payment.
      if (patch.amount !== undefined) {
        const cleaned = String(patch.amount).replace(/[^\d]/g, '');
        if (!cleaned) {
          return prev.map((row, i) => (i === index ? { ...row, amount: '' } : row));
        }

        const requestedAmount = Number(cleaned);
        const orderTotal = Number(order?.total_price_uzs || 0);
        const orderPaid = Number(order?.total_paid_uzs || 0);
        const remaining = Math.max(0, orderTotal - orderPaid);
        const otherRowsTotal = prev.reduce(
          (sum, row, i) => (i === index ? sum : sum + (Number(row.amount) || 0)),
          0,
        );
        const maxForRow = Math.max(0, remaining - otherRowsTotal);
        const clampedAmount = Math.min(requestedAmount, maxForRow);
        const extraAmount = Math.max(0, requestedAmount - clampedAmount);

        if (extraAmount > 0) {
          setPaymentInputWarning(
            `Вы внесли лишнее ${formatMoney(extraAmount, language)}. Максимум для этой строки: ${formatMoney(maxForRow, language)}.`,
          );
        } else {
          setPaymentInputWarning('');
        }

        return prev.map((row, i) =>
          i === index ? { ...row, amount: clampedAmount > 0 ? String(clampedAmount) : '' } : row,
        );
      }

      return prev.map((row, i) => (i === index ? { ...row, ...patch } : row));
    });
  };

  const startEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setEditingPaymentForm({
      amount: String(Number(payment.paid_amount ?? payment.amount_uzs ?? 0)),
      method: normalizePaymentMethod(String(payment.payment_type ?? payment.method ?? 'CASH')),
    });
  };

  const cancelEditPayment = () => {
    setEditingPaymentId('');
    setEditingPaymentForm({ amount: '', method: 'CASH' });
  };

  const handleUpdatePayment = async () => {
    const nextAmount = Number(editingPaymentForm.amount);
    if (!editingPaymentId) return;
    if (!nextAmount || nextAmount <= 0) {
      setMessage('❌ Укажите корректную сумму для изменения платежа');
      return;
    }

    setUpdatingPaymentId(editingPaymentId);
    try {
      await api.patch(`/payments/${editingPaymentId}`, {
        paid_amount: nextAmount,
        payment_type: editingPaymentForm.method,
        currency: 'UZS',
      });
      setMessage('✅ Платеж обновлен');
      cancelEditPayment();
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось обновить платеж'));
    } finally {
      setUpdatingPaymentId('');
    }
  };

  const createPaymentRequest = async (payload: any) => {
    try {
      return await api.post(`/payments/orders/${orderId}`, payload);
    } catch (err: any) {
      // Fallback for legacy backend route naming
      if (err?.response?.status === 404) {
        return await api.post(`/orders/${orderId}/payments`, payload);
      }
      throw err;
    }
  };

  const handleAddPayment = async () => {
    const normalizedRows = paymentRows
      .map((row) => ({
        paid_amount: Number(row.amount),
        payment_type: row.method,
        currency: 'UZS',
      }))
      .filter((row) => row.paid_amount > 0);

    if (normalizedRows.length === 0) {
      setMessage('❌ Укажите хотя бы одну сумму оплаты');
      return;
    }

    if (splitPaymentMode && normalizedRows.length < 2) {
      setMessage('❌ Для частичной оплаты укажите минимум 2 способа');
      return;
    }

    const remainingToPay = Math.max(
      0,
      Number(order?.total_price_uzs || 0) - Number(order?.total_paid_uzs || 0),
    );
    const enteredTotal = normalizedRows.reduce((sum, row) => sum + row.paid_amount, 0);

    if (enteredTotal > remainingToPay) {
      setMessage(`❌ Сумма оплаты превышает остаток (${formatMoney(remainingToPay, language)})`);
      return;
    }

    setAddingPayment(true);
    try {
      const note = paymentNote.trim();
      const payload = splitPaymentMode
        ? { split_payments: normalizedRows, note: note || undefined }
        : { ...normalizedRows[0], note: note || undefined };

      await createPaymentRequest(payload);
      setMessage(
        `✅ Оплата добавлена (${formatMoney(enteredTotal, language)}${splitPaymentMode ? `, способов: ${normalizedRows.length}` : ''})`,
      );
      setPaymentInputWarning('');
      setPaymentRows([{ amount: '', method: 'CASH' }]);
      setPaymentNote('');
      mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ Ошибка: ' + (err.response?.data?.message || 'Не удалось добавить оплату'));
    } finally {
      setAddingPayment(false);
    }
  };

  const handleToggleSplitPaymentMode = () => {
    setSplitPaymentMode((prev) => {
      const next = !prev;
      if (next && paymentRows.length < 2) {
        setPaymentRows((rows) => [...rows, { amount: '', method: 'UZCARD' }]);
      }
      if (!next && paymentRows.length > 1) {
        setPaymentRows([paymentRows[0]]);
      }
      return next;
    });
  };


  const currentStatus = order.status;
  const priceApproved = order.price_approved_at !== null;
  const priceRejected = order.price_rejected_at !== null;
  const hasPrice = Number(order.total_price_uzs) > 0;
  const canCompleteDetails = ['in_repair'].includes(currentStatus) && priceApproved;
  const needsPriceApproval = isClient && hasPrice && !priceApproved && !priceRejected;
  const remainingPayment = Math.max(
    0,
    Number(order.total_price_uzs || 0) - Number(order.total_paid_uzs || 0),
  );
  const enteredPaymentTotal = paymentRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Заказ #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-gray-500 mt-1">Создан {formatDate(order.order_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={currentStatus} />
            <button
              onClick={() => exportOrderToPDF(order, (user as any)?.preferred_language || order.client?.preferred_language || 'ru')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Экспорт в PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== КОНТАКТЫ КЛИЕНТА ===== */}
        {(isAdmin || isOperator || isMaster) && order.client && <OrderClientContactsCard client={order.client} />}

        {/* ===== БЛОК С ПОДСКАЗКАМИ ПО СТАТУСУ ===== */}
        <div className="mb-6">
          <OrderStatusHint status={currentStatus} userRole={user?.role || undefined} />
        </div>

        {/* ===== ПОШАГОВЫЙ WORKFLOW ===== */}
        <div className="mb-6">
          <OrderWorkflowGuide
            status={currentStatus}
            priceApproved={!!order?.price_approved_at}
            hasMaster={order?.details?.some((d: any) => d.attached_to)}
            hasPrice={Number(order?.total_price_uzs || 0) > 0}
          />
        </div>

        {(isAdmin || isOperator || isMaster) && (
          <OrderStatusManagementCard
            order={order}
            currentStatus={currentStatus}
            allowedTransitions={allowedTransitions}
            actionLoading={actionLoading}
            message={message}
            requireStatusComment={requireStatusComment}
            statusComment={statusComment}
            onStatusCommentChange={setStatusComment}
            onStatusChange={handleStatusChange}
          />
        )}

        <OrderStatusDocsCard />

        <OrderPriceApprovalCard
          totalPrice={Number(order.total_price_uzs || 0)}
          language={language}
          needsPriceApproval={needsPriceApproval}
          showApproved={hasPrice && priceApproved && (isAdmin || isOperator || isMaster || isClient)}
          showRejected={hasPrice && priceRejected && (isAdmin || isOperator || isMaster || isClient)}
          actionLoading={actionLoading}
          onApprovePrice={handleApprovePrice}
          onRejectPrice={handleRejectPrice}
        />

        <OrderSummaryCard order={order} currentStatus={currentStatus} language={language} />

        {(isAdmin || isOperator) && order.details?.length > 0 && (
          <OrderMasterAssignmentCard
            details={order.details}
            masters={mastersList}
            selectedMastersByDetail={selectedMastersByDetail}
            assigningDetailId={assigningDetailId}
            onSelectedMasterChange={(detailId, masterId) =>
              setSelectedMastersByDetail((prev) => ({ ...prev, [detailId]: masterId }))
            }
            onAssignMaster={handleAssignMaster}
          />
        )}

        <OrderPricingCard
          order={order}
          language={language}
          isVisible={(isAdmin || isOperator || isMaster) && (!order.total_price_uzs || Number(order.total_price_uzs) === 0)}
          isUpdateVisible={(isAdmin || isOperator || isMaster) && hasPrice}
          pricesForm={pricesForm}
          settingPrice={settingPrice}
          updatePriceForm={updatePriceForm}
          updatingPrice={updatingPrice}
          setPriceTitle={t('order.set_price_for_detail')}
          pricePerItemLabel={t('order.price_per_item')}
          itemsTotalLabel={t('order.items_total')}
          onPriceChange={(detailId, value) => setPricesForm((prev) => ({ ...prev, [detailId]: value }))}
          onSetPrice={handleSetPrice}
          onUpdatePriceFormChange={(patch) => setUpdatePriceForm((prev) => ({ ...prev, ...patch }))}
          onUpdatePrice={handleUpdatePrice}
        />

        {(isAdmin || isOperator || isMaster) && hasPrice && (
          <OrderPriceHistoryCard
            records={priceHistoryData}
            loading={loadingPriceHistory}
            visible={showPriceHistory}
            title={t('order.price_history')}
            emptyLabel={t('order.no_price_history')}
            onShow={fetchPriceHistory}
            onHide={() => setShowPriceHistory(false)}
          />
        )}

        {/* ===== Работы по заказу ===== */}
        <OrderWorkDetailsCard
          details={order.details || []}
          language={language}
          canManageDetails={isAdmin || isOperator || isMaster}
          canCompleteDetails={canCompleteDetails}
          completingDetail={completingDetail}
          onCompleteDetail={handleCompleteDetail}
        />

        {hasPrice && (
          <OrderPaymentsCard
            order={order}
            language={language}
            canManagePayments={isAdmin || isOperator}
            editingPaymentId={editingPaymentId}
            editingPaymentForm={editingPaymentForm}
            updatingPaymentId={updatingPaymentId}
            splitPaymentMode={splitPaymentMode}
            paymentRows={paymentRows}
            addingPayment={addingPayment}
            enteredPaymentTotal={enteredPaymentTotal}
            paymentNote={paymentNote}
            paymentInputWarning={paymentInputWarning}
            remainingPayment={remainingPayment}
            onStartEditPayment={startEditPayment}
            onCancelEditPayment={cancelEditPayment}
            onUpdatePayment={handleUpdatePayment}
            onEditingPaymentAmountChange={(value) => setEditingPaymentForm((prev) => ({ ...prev, amount: value }))}
            onEditingPaymentMethodChange={(method) => setEditingPaymentForm((prev) => ({ ...prev, method }))}
            onToggleSplitPaymentMode={handleToggleSplitPaymentMode}
            onUpdatePaymentRow={updatePaymentRow}
            onRemovePaymentRow={removePaymentRow}
            onAddPaymentRow={addPaymentRow}
            onPaymentNoteChange={setPaymentNote}
            onAddPayment={handleAddPayment}
            paymentMethodLabel={paymentMethodLabel}
          />
        )}

        <OrderLifecycleCard entries={lifecycle} />

        <OrderChatCard
          messages={messagesList}
          currentUserId={user?.id}
          messageText={messageText}
          sendingMessage={sendingMessage}
          chatContainerRef={chatContainerRef}
          onMessageTextChange={setMessageText}
          onSendMessage={handleSendMessage}
        />

      </div>
    </div>
  );
}
