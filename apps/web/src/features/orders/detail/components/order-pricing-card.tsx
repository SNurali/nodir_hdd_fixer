import { DollarSign, Loader2, Minus, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import type { Order, PriceUpdateForm } from '../types';

interface OrderPricingCardProps {
  order: Order;
  language: string;
  isVisible: boolean;
  isUpdateVisible: boolean;
  pricesForm: Record<string, string>;
  settingPrice: boolean;
  updatePriceForm: PriceUpdateForm;
  updatingPrice: boolean;
  setPriceTitle: string;
  pricePerItemLabel: string;
  itemsTotalLabel: string;
  onPriceChange: (detailId: string, value: string) => void;
  onSetPrice: () => void;
  onUpdatePriceFormChange: (patch: Partial<PriceUpdateForm>) => void;
  onUpdatePrice: (direction: 'add' | 'subtract') => void;
}

export function OrderPricingCard({
  order,
  language,
  isVisible,
  isUpdateVisible,
  pricesForm,
  settingPrice,
  updatePriceForm,
  updatingPrice,
  setPriceTitle,
  pricePerItemLabel,
  itemsTotalLabel,
  onPriceChange,
  onSetPrice,
  onUpdatePriceFormChange,
  onUpdatePrice,
}: OrderPricingCardProps) {
  if (!isVisible && !isUpdateVisible) {
    return null;
  }

  const details = order.details || [];
  const enteredTotal = Object.values(pricesForm).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (
    <>
      {isVisible && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            {setPriceTitle}
          </h3>
          <div className="space-y-4 mb-4">
            {details.map((detail, index) => (
              <div key={detail.id} className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {index + 1}. {detail.equipment?.name_rus || 'Оборудование'} - {detail.issue?.name_rus || 'Проблема'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {pricePerItemLabel} (UZS)
                  </label>
                  <input
                    type="number"
                    value={pricesForm[detail.id] || ''}
                    onChange={(event) => onPriceChange(detail.id, event.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={settingPrice}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-blue-200 dark:border-blue-800 pt-4">
            <div className="text-blue-900 dark:text-blue-100 font-bold">
              {itemsTotalLabel}: {formatMoney(enteredTotal, language)}
            </div>
            <button
              onClick={onSetPrice}
              disabled={settingPrice || Object.values(pricesForm).every((value) => !value || Number(value) <= 0)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {settingPrice ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <DollarSign size={18} />
                  Установить
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isUpdateVisible && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Изменить текущую цену: {formatMoney(order.total_price_uzs || 0, language)}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Сумма изменения (UZS)
                </label>
                <input
                  type="number"
                  value={updatePriceForm.amount}
                  onChange={(event) => onUpdatePriceFormChange({ amount: event.target.value })}
                  placeholder="25000"
                  className="w-full px-4 py-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={updatingPrice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Причина *
                </label>
                <input
                  type="text"
                  value={updatePriceForm.reason}
                  onChange={(event) => onUpdatePriceFormChange({ reason: event.target.value })}
                  placeholder="Например: замена контроллера"
                  className="w-full px-4 py-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={updatingPrice}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdatePrice('add')}
                disabled={updatingPrice || !updatePriceForm.amount || !updatePriceForm.reason}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {updatingPrice ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={20} />
                    Добавить к цене
                  </>
                )}
              </button>
              <button
                onClick={() => onUpdatePrice('subtract')}
                disabled={updatingPrice || !updatePriceForm.amount || !updatePriceForm.reason}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {updatingPrice ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Minus size={20} />
                    Вычесть из цены
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
