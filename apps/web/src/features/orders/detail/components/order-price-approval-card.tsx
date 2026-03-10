import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatMoney } from '@/lib/money';

interface OrderPriceApprovalCardProps {
  totalPrice: number;
  language: string;
  needsPriceApproval: boolean;
  showApproved: boolean;
  showRejected: boolean;
  actionLoading: string;
  onApprovePrice: () => void;
  onRejectPrice: () => void;
}

export function OrderPriceApprovalCard({
  totalPrice,
  language,
  needsPriceApproval,
  showApproved,
  showRejected,
  actionLoading,
  onApprovePrice,
  onRejectPrice,
}: OrderPriceApprovalCardProps) {
  if (needsPriceApproval) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <Clock className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={32} />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">🔔 Требуется одобрение цены</h3>
            <p className="text-yellow-700 dark:text-yellow-200 mb-4">
              Мастер установил цену. Пожалуйста, подтвердите или отклоните.
            </p>
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">
              💰 {formatMoney(totalPrice, language)}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onApprovePrice}
                disabled={actionLoading === 'approve_price'}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'approve_price' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Одобрить цену
                  </>
                )}
              </button>
              <button
                onClick={onRejectPrice}
                disabled={actionLoading === 'reject_price'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'reject_price' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle size={20} />
                    Отклонить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showApproved) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <CheckCircle2 className="text-green-600 dark:text-green-400" size={32} />
          <div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100">✅ Цена одобрена клиентом</h3>
            <p className="text-green-700 dark:text-green-200">Мастер приступил к выполнению работ.</p>
          </div>
        </div>
      </div>
    );
  }

  if (showRejected) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <XCircle className="text-red-600 dark:text-red-400" size={32} />
          <div>
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100">❌ Цена отклонена</h3>
            <p className="text-red-700 dark:text-red-200">Администратор свяжется для согласования.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
