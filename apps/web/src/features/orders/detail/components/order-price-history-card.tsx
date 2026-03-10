import { History, Loader2 } from 'lucide-react';
import { useAppSettings } from '@/app/app-settings-provider';
import type { PriceHistoryRecord } from '../types';

interface OrderPriceHistoryCardProps {
  records: PriceHistoryRecord[];
  loading: boolean;
  visible: boolean;
  title: string;
  emptyLabel: string;
  onShow: () => void;
  onHide: () => void;
}

export function OrderPriceHistoryCard({
  records,
  loading,
  visible,
  title,
  emptyLabel,
  onShow,
  onHide,
}: OrderPriceHistoryCardProps) {
  const { formatDateTime } = useAppSettings();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History size={20} className="text-gray-500" />
          {title}
        </h3>
        {!visible ? (
          <button onClick={onShow} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-all">
            Показать историю
          </button>
        ) : (
          <button onClick={onHide} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline transition-all">
            Скрыть
          </button>
        )}
      </div>
      {visible && (
        <div className="mt-4 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-gray-500 text-sm italic">{emptyLabel}</p>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {Number(record.old_price).toLocaleString()} → {Number(record.new_price).toLocaleString()} UZS
                  </span>
                  <span className="text-gray-500 text-xs font-medium">
                    {record.changed_at ? formatDateTime(record.changed_at) : '-'}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400 flex flex-col gap-1">
                  {record.reason && (
                    <span className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      Причина: {record.reason}
                    </span>
                  )}
                  {record.user?.full_name && (
                    <span className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      Автор: {record.user.full_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
