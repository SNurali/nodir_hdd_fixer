import { Loader2, UserCheck } from 'lucide-react';
import type { MasterOption, OrderDetail } from '../types';

interface OrderMasterAssignmentCardProps {
  details: OrderDetail[];
  masters: MasterOption[];
  selectedMastersByDetail: Record<string, string>;
  assigningDetailId: string;
  onSelectedMasterChange: (detailId: string, masterId: string) => void;
  onAssignMaster: (detailId: string) => void;
}

export function OrderMasterAssignmentCard({
  details,
  masters,
  selectedMastersByDetail,
  assigningDetailId,
  onSelectedMasterChange,
  onAssignMaster,
}: OrderMasterAssignmentCardProps) {
  if (!details.length) {
    return null;
  }

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
        <UserCheck size={20} />
        Назначение мастера по каждой позиции
      </h3>
      <div className="space-y-4">
        {details.map((detail, index) => (
          <div key={detail.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                  {index + 1}. {detail.equipment?.name_rus || 'Оборудование'} - {detail.issue?.name_rus || 'Проблема'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Текущий мастер: {detail.master?.full_name || 'Не назначен'}
                </p>
                <select
                  value={selectedMastersByDetail[detail.id] || ''}
                  onChange={(event) => onSelectedMasterChange(detail.id, event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={assigningDetailId === detail.id || masters.length === 0}
                >
                  <option value="">-- Выберите мастера --</option>
                  {masters.map((master) => (
                    <option key={master.id} value={master.id}>
                      {master.full_name || master.phone}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => onAssignMaster(detail.id)}
                disabled={assigningDetailId === detail.id || !selectedMastersByDetail[detail.id]}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed min-w-[170px]"
              >
                {assigningDetailId === detail.id ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <UserCheck size={20} />
                    {detail.master?.full_name ? 'Переназначить' : 'Назначить'}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        <div className="text-xs text-indigo-800/80 dark:text-indigo-200/80">
          Каждая позиция оборудования назначается отдельно.
        </div>
      </div>
    </div>
  );
}
