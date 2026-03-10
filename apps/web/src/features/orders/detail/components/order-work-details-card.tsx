import { CheckCircle2, Clock, Hammer, Loader2 } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import type { OrderDetail } from '../types';

interface OrderWorkDetailsCardProps {
  details: OrderDetail[];
  language: string;
  canManageDetails: boolean;
  canCompleteDetails: boolean;
  completingDetail: string;
  onCompleteDetail: (detailId: string) => void;
}

export function OrderWorkDetailsCard({
  details,
  language,
  canManageDetails,
  canCompleteDetails,
  completingDetail,
  onCompleteDetail,
}: OrderWorkDetailsCardProps) {
  if (!details.length) {
    return null;
  }

  const completedCount = details.filter((detail) => Number(detail.is_completed) === 1).length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Hammer size={24} className="text-blue-500" />
        Работы по заказу ({completedCount}/{details.length} выполнено)
      </h2>
      <div className="space-y-3">
        {details.map((detail) => {
          const isCompleted = Number(detail.is_completed) === 1;

          return (
            <div
              key={detail.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock size={18} className="text-gray-400" />
                  )}
                  <span className="font-medium">{detail.equipment?.name_rus || 'Оборудование'}</span>
                  <span className="text-gray-400 mx-1">-</span>
                  <span className="text-gray-600 dark:text-gray-400">{detail.issue?.name_rus || 'Проблема'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {detail.master?.full_name && <span>Мастер: {detail.master.full_name}</span>}
                  {detail.price && <span>Цена: {formatMoney(detail.price, language)}</span>}
                  {detail.description_of_issue && <span>• {detail.description_of_issue}</span>}
                </div>
              </div>
              {canManageDetails && !isCompleted && (
                <button
                  onClick={() => onCompleteDetail(detail.id)}
                  disabled={completingDetail === detail.id || !canCompleteDetails}
                  title={!canCompleteDetails ? 'Доступно только после одобрения цены и начала ремонта' : undefined}
                  className="ml-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:cursor-not-allowed"
                >
                  {completingDetail === detail.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Выполнено
                </button>
              )}
              {isCompleted && (
                <span className="ml-4 text-green-600 dark:text-green-400 font-medium text-sm flex items-center gap-1">
                  <CheckCircle2 size={16} /> Готово
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
