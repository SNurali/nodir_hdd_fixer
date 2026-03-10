import { CheckCircle2, DollarSign, Loader2, Minus, Plus } from 'lucide-react';
import { useAppSettings } from '@/app/app-settings-provider';
import { formatMoney } from '@/lib/money';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import type { Order, PaymentMethod, PaymentRecord, PaymentRow } from '../types';

interface OrderPaymentsCardProps {
  order: Order;
  language: string;
  canManagePayments: boolean;
  editingPaymentId: string;
  editingPaymentForm: { amount: string; method: PaymentMethod };
  updatingPaymentId: string;
  splitPaymentMode: boolean;
  paymentRows: PaymentRow[];
  addingPayment: boolean;
  enteredPaymentTotal: number;
  paymentNote: string;
  paymentInputWarning: string;
  remainingPayment: number;
  onStartEditPayment: (payment: PaymentRecord) => void;
  onCancelEditPayment: () => void;
  onUpdatePayment: () => void;
  onEditingPaymentAmountChange: (value: string) => void;
  onEditingPaymentMethodChange: (method: PaymentMethod) => void;
  onToggleSplitPaymentMode: () => void;
  onUpdatePaymentRow: (index: number, patch: Partial<PaymentRow>) => void;
  onRemovePaymentRow: (index: number) => void;
  onAddPaymentRow: () => void;
  onPaymentNoteChange: (value: string) => void;
  onAddPayment: () => void;
  paymentMethodLabel: (paymentType: string) => string;
}

export function OrderPaymentsCard({
  order,
  language,
  canManagePayments,
  editingPaymentId,
  editingPaymentForm,
  updatingPaymentId,
  splitPaymentMode,
  paymentRows,
  addingPayment,
  enteredPaymentTotal,
  paymentNote,
  paymentInputWarning,
  remainingPayment,
  onStartEditPayment,
  onCancelEditPayment,
  onUpdatePayment,
  onEditingPaymentAmountChange,
  onEditingPaymentMethodChange,
  onToggleSplitPaymentMode,
  onUpdatePaymentRow,
  onRemovePaymentRow,
  onAddPaymentRow,
  onPaymentNoteChange,
  onAddPayment,
  paymentMethodLabel,
}: OrderPaymentsCardProps) {
  const { formatDateTime } = useAppSettings();
  const totalPaid = Number(order.total_paid_uzs || 0);
  const totalPrice = Number(order.total_price_uzs || 0);
  const isFullyPaid = totalPaid >= totalPrice;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <DollarSign size={24} className="text-blue-500" />
        Оплата
      </h2>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Оплачено</span>
          <span className="font-bold">
            {formatMoney(totalPaid, language)} / {formatMoney(totalPrice, language)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{
              width: totalPrice > 0 ? `${Math.min(100, (totalPaid / totalPrice) * 100)}%` : '0%',
            }}
          />
        </div>
        {isFullyPaid && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 size={14} /> Оплата полностью внесена
          </p>
        )}
      </div>

      {order.payments && order.payments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">История платежей</h4>
          <div className="space-y-2">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              >
                {editingPaymentId === payment.id ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-green-500" />
                      <input
                        type="number"
                        value={editingPaymentForm.amount}
                        onChange={(event) => onEditingPaymentAmountChange(event.target.value)}
                        className="w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        disabled={updatingPaymentId === payment.id}
                      />
                      <select
                        value={editingPaymentForm.method}
                        onChange={(event) => onEditingPaymentMethodChange(event.target.value as PaymentMethod)}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        disabled={updatingPaymentId === payment.id}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 md:ml-auto">
                      <button
                        type="button"
                        onClick={onUpdatePayment}
                        disabled={updatingPaymentId === payment.id}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {updatingPaymentId === payment.id ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEditPayment}
                        disabled={updatingPaymentId === payment.id}
                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs font-semibold"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-green-500" />
                      <span className="font-medium">
                        {formatMoney(payment.paid_amount ?? payment.amount_uzs ?? 0, language, payment.currency || 'UZS')}
                      </span>
                      <span className="text-gray-400">
                        ({paymentMethodLabel(String(payment.payment_type ?? payment.method ?? 'CASH'))})
                      </span>
                      {canManagePayments && (
                        <button
                          type="button"
                          onClick={() => onStartEditPayment(payment)}
                          className="ml-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Изменить
                        </button>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">
                      {payment.paid_at || payment.created_at
                        ? formatDateTime(payment.paid_at ?? payment.created_at ?? '')
                        : '-'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canManagePayments && totalPaid < totalPrice && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-medium text-gray-500">Добавить оплату</h4>
            <button
              type="button"
              onClick={onToggleSplitPaymentMode}
              disabled={addingPayment}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                splitPaymentMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {splitPaymentMode ? 'Частичная оплата: ВКЛ' : 'Включить частичную оплату'}
            </button>
          </div>

          <div className="space-y-3 mb-3">
            {paymentRows.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input
                    type="number"
                    placeholder="Сумма (UZS)"
                    value={row.amount}
                    onChange={(event) => onUpdatePaymentRow(index, { amount: event.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={addingPayment}
                  />
                </div>
                <div className="col-span-5">
                  <select
                    value={row.method}
                    onChange={(event) => onUpdatePaymentRow(index, { method: event.target.value as PaymentMethod })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={addingPayment}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex justify-end">
                  {splitPaymentMode && paymentRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemovePaymentRow(index)}
                      disabled={addingPayment}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                      title="Удалить способ"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {splitPaymentMode && (
            <button
              type="button"
              onClick={onAddPaymentRow}
              disabled={addingPayment}
              className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus size={16} /> Добавить ещё способ
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-sm text-gray-500">
              Введено: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatMoney(enteredPaymentTotal, language)}</span>
            </div>
            <div>
              <input
                type="text"
                placeholder="Примечание"
                value={paymentNote}
                onChange={(event) => onPaymentNoteChange(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={addingPayment}
              />
            </div>
          </div>
          {paymentInputWarning && <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">⚠ {paymentInputWarning}</p>}
          {remainingPayment > 0 && (
            <p className="text-xs text-gray-500 mb-3">Остаток к оплате: {formatMoney(remainingPayment, language)}</p>
          )}
          <button
            onClick={onAddPayment}
            disabled={addingPayment || enteredPaymentTotal <= 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {addingPayment ? <Loader2 size={20} className="animate-spin" /> : <DollarSign size={20} />}
            Принять оплату {splitPaymentMode ? '(частично)' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
