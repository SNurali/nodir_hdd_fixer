import type { ComponentType } from 'react';
import type { Equipment, OrderItemDraft } from '../types';
import { getEntityDisplayName } from '../utils';

interface NewOrderStepEquipmentProps {
  equipmentList: Equipment[];
  selectedEquipmentId: string;
  orderItems: OrderItemDraft[];
  onSelectEquipment: (equipmentId: string) => void;
  onCheckout: () => void;
  onReload: () => void;
  getEquipmentIconForItem: (equipment: Equipment) => ComponentType<any>;
  title: string;
  subtitle: string;
}

export function NewOrderStepEquipment({
  equipmentList,
  selectedEquipmentId,
  orderItems,
  onSelectEquipment,
  onCheckout,
  onReload,
  getEquipmentIconForItem,
  title,
  subtitle,
}: NewOrderStepEquipmentProps) {
  return (
    <>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {equipmentList.map((equipment, index) => {
          const Icon = getEquipmentIconForItem(equipment);
          const isSelected = selectedEquipmentId === equipment.id;
          const equipmentName = getEntityDisplayName(equipment, `Устройство ${index + 1}`);

          return (
            <button
              key={equipment.id || index}
              onClick={() => onSelectEquipment(equipment.id)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 min-w-[90px] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon size={24} />
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight break-words w-full ${
                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {equipmentName}
              </span>
            </button>
          );
        })}
      </div>

      {equipmentList.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-2">Нет доступного оборудования</div>
          <button onClick={onReload} className="text-blue-500 hover:underline text-sm">
            Обновить страницу
          </button>
        </div>
      )}

      {orderItems.length > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-emerald-700">Уже добавлено устройств: {orderItems.length}</p>
              <p className="text-xs text-emerald-600 mt-1">
                Можно добавить ещё или сразу перейти к оформлению контактов.
              </p>
            </div>
            <button
              onClick={onCheckout}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
            >
              Перейти к оформлению
            </button>
          </div>
        </div>
      )}
    </>
  );
}
