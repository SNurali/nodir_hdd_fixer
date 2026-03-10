import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import type { AllowedTransition, Order, OrderStatus } from '../types';
import {
  checkRequirementsMet,
  getOrderProgressPercentage,
  getStatusDescription,
  isRequirementMet,
} from '../utils';

interface OrderStatusManagementCardProps {
  order: Order;
  currentStatus: OrderStatus;
  allowedTransitions: AllowedTransition[];
  actionLoading: string;
  message: string;
  requireStatusComment: boolean;
  statusComment: string;
  onStatusCommentChange: (value: string) => void;
  onStatusChange: (status: OrderStatus, reason?: string) => void;
}

export function OrderStatusManagementCard({
  order,
  currentStatus,
  allowedTransitions,
  actionLoading,
  message,
  requireStatusComment,
  statusComment,
  onStatusCommentChange,
  onStatusChange,
}: OrderStatusManagementCardProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
        <Wrench size={20} />
        Управление статусом
      </h3>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Прогресс заказа</span>
          <span>{getStatusDescription(currentStatus)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${getOrderProgressPercentage(currentStatus)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Начало</span>
          <span>Завершение</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {allowedTransitions.map((transition) => {
          const config = STATUS_CONFIG[transition.to];
          if (!config) return null;

          const requirementsMet = checkRequirementsMet(transition, order);

          return (
            <div key={transition.to} className="flex flex-col gap-1">
              <button
                onClick={() => onStatusChange(transition.to, statusComment)}
                disabled={actionLoading === transition.to || currentStatus === transition.to || !requirementsMet}
                className={`p-3 rounded-xl border-2 transition-all font-medium text-sm relative ${
                  currentStatus === transition.to
                    ? 'bg-blue-600 text-white border-blue-600'
                    : requirementsMet
                      ? 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-70 cursor-not-allowed'
                } disabled:opacity-50`}
                title={config.description}
              >
                {config.label}
                {!requirementsMet && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
              </button>
              {transition.requirements && transition.requirements.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  Требуется:{' '}
                  {transition.requirements.map((requirement, index, requirements) => (
                    <span
                      key={`${transition.to}-${requirement}`}
                      className={isRequirementMet(requirement, order) ? 'text-green-600 dark:text-green-400' : 'text-red-500'}
                    >
                      {requirement}
                      {index < requirements.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {requireStatusComment && (
        <div className="mt-4">
          <label htmlFor="status-comment" className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Комментарий к смене статуса
          </label>
          <textarea
            id="status-comment"
            value={statusComment}
            onChange={(event) => onStatusCommentChange(event.target.value)}
            rows={3}
            placeholder="Укажите причину или пояснение"
            className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      {message && (
        <div
          className={`mt-4 p-4 rounded-xl border-l-4 font-medium flex items-start gap-3 shadow-sm ${
            message.startsWith('✅')
              ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-red-100 border-red-600 text-red-900 dark:bg-red-900/40 dark:text-red-100'
          }`}
        >
          {message.startsWith('✅') ? (
            <CheckCircle2 className="mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="mt-0.5 flex-shrink-0" />
          )}
          <p className="flex-1 whitespace-pre-wrap">{message.replace(/^[❌✅]\s*/, '')}</p>
        </div>
      )}
    </div>
  );
}
