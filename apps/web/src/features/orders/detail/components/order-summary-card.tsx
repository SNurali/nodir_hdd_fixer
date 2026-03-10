import { Wrench } from 'lucide-react';
import { useAppSettings } from '@/app/app-settings-provider';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from './status-badge';
import type { Order, OrderStatus } from '../types';

interface OrderSummaryCardProps {
  order: Order;
  currentStatus: OrderStatus;
  language: string;
}

export function OrderSummaryCard({ order, currentStatus, language }: OrderSummaryCardProps) {
  const { formatDate } = useAppSettings();
  const totalDetails = order.details?.length || 0;
  const assignedMastersCount = order.details?.filter((detail) => !!detail.attached_to).length || 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Wrench size={24} className="text-blue-500" />
        Информация о заказе
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Статус</span>
          <StatusBadge status={currentStatus} />
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Позиции</span>
          <span className="font-medium">{totalDetails}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Цена</span>
          <span className="font-bold text-lg">
            {Number(order.total_price_uzs) === 0 ? (
              <span className="text-yellow-600">Будет установлена</span>
            ) : (
              formatMoney(order.total_price_uzs, language)
            )}
          </span>
        </div>
        {order.deadline && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500">Срок выполнения</span>
            <span className="font-medium">{formatDate(order.deadline)}</span>
          </div>
        )}
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500">Назначено мастеров</span>
          <span className="font-medium">
            {assignedMastersCount}/{totalDetails}
          </span>
        </div>
      </div>
    </div>
  );
}
