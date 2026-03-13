import { PhoneBadge } from '@/components/phone-display';
import type { NewOrderFormData, OrderItemDraft } from '../types';

interface NewOrderStepReviewProps {
  reviewItems: OrderItemDraft[];
  formData: NewOrderFormData;
  title: string;
  subtitle: string;
  fullNameLabel: string;
  phoneLabel: string;
  getEquipmentName: (equipmentId: string) => string;
  getIssueName: (issueId: string) => string;
}

export function NewOrderStepReview({
  reviewItems,
  formData,
  title,
  subtitle,
  fullNameLabel,
  phoneLabel,
  getEquipmentName,
  getIssueName,
}: NewOrderStepReviewProps) {
  return (
    <>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>

      <div className="card p-6 space-y-4">
        <div className="py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Позиции заказа</span>
          <div className="mt-3 space-y-2">
            {reviewItems.map((item, index) => (
              <div
                key={`${item.equipment_id}-${item.issue_id}-${index}`}
                className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {index + 1}. {getEquipmentName(item.equipment_id)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{getIssueName(item.issue_id)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400">{fullNameLabel}</span>
          <span className="font-semibold text-foreground">{formData.full_name || '-'}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400">{phoneLabel}</span>
          {formData.phone ? <PhoneBadge phone={formData.phone} /> : <span className="font-semibold text-foreground">-</span>}
        </div>
      </div>
    </>
  );
}
