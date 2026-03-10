import { CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import type { Issue, OrderItemDraft } from '../types';
import { getEntityDisplayName } from '../utils';

interface NewOrderStepIssueProps {
  currentEquipmentName: string;
  issuesList: Issue[];
  selectedIssueId: string;
  description: string;
  orderItems: OrderItemDraft[];
  canAddCurrentItem: boolean;
  title: string;
  subtitle: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  itemsCountLabel: string;
  onBackToEquipment: () => void;
  onSelectIssue: (issueId: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddCurrentItem: () => void;
  onCheckout: () => void;
  onRemoveOrderItem: (index: number) => void;
  getEquipmentName: (equipmentId: string) => string;
  getIssueName: (issueId: string) => string;
}

export function NewOrderStepIssue({
  currentEquipmentName,
  issuesList,
  selectedIssueId,
  description,
  orderItems,
  canAddCurrentItem,
  title,
  subtitle,
  descriptionLabel,
  descriptionPlaceholder,
  itemsCountLabel,
  onBackToEquipment,
  onSelectIssue,
  onDescriptionChange,
  onAddCurrentItem,
  onCheckout,
  onRemoveOrderItem,
  getEquipmentName,
  getIssueName,
}: NewOrderStepIssueProps) {
  return (
    <>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-blue-700 font-medium">Текущее устройство</p>
            <p className="text-base font-bold text-blue-900">{currentEquipmentName}</p>
          </div>
          <button
            onClick={onBackToEquipment}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            Сменить устройство
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {issuesList.map((issue) => {
          const issueName = getEntityDisplayName(issue, 'Неисправность');
          const isSelected = selectedIssueId === issue.id;

          return (
            <button
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900'
                  }`}
                >
                  {isSelected && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span
                  className={`font-medium break-words ${
                    isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {issueName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <label className="input-label">{descriptionLabel}</label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={descriptionPlaceholder}
          className="input-field h-32 resize-none"
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAddCurrentItem}
          disabled={!canAddCurrentItem}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle size={18} className="inline mr-2" />
          Добавить это устройство
        </button>
        {orderItems.length > 0 && (
          <button
            onClick={onCheckout}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Перейти к оформлению ({orderItems.length})
          </button>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 self-center">
          {itemsCountLabel}: <span className="font-bold">{orderItems.length}</span>
        </p>
      </div>

      {orderItems.length > 0 && (
        <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Позиции в заказе</p>
          <div className="space-y-2">
            {orderItems.map((item, index) => (
              <div
                key={`${item.equipment_id}-${item.issue_id}-${index}`}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                    {index + 1}. {getEquipmentName(item.equipment_id)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 break-words">{getIssueName(item.issue_id)}</p>
                </div>
                <button
                  onClick={() => onRemoveOrderItem(index)}
                  className="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50"
                  title="Удалить позицию"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
