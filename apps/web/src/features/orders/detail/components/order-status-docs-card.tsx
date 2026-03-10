import { STATUS_CONFIG } from '../constants';

const COLOR_MAP: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

export function OrderStatusDocsCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <details className="group cursor-pointer">
        <summary className="text-lg font-bold flex items-center gap-2 list-none outline-none">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-500 flex items-center justify-center font-serif text-sm">
            i
          </div>
          <span className="text-gray-800 dark:text-gray-200 border-b border-dashed border-gray-400 group-hover:border-blue-500 transition-colors">
            Инструкция и правила статусов
          </span>
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div
              key={key}
              className="flex flex-col p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50"
            >
              <span
                className={`self-start inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full border text-xs font-semibold ${
                  COLOR_MAP[config.color] || COLOR_MAP.purple
                }`}
              >
                <config.icon size={14} />
                {config.label}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{config.description}</p>
              {key === 'ready_for_pickup' && (
                <p className="text-xs text-blue-500 mt-1 mt-auto font-medium">
                  Требования: Все работы отмечены как выполненные
                </p>
              )}
              {key === 'issued' && (
                <p className="text-xs text-blue-500 mt-1 mt-auto font-medium">Требования: Оплата внесена (100%)</p>
              )}
              {(key === 'assigned' || key === 'in_repair') && (
                <p className="text-xs text-blue-500 mt-1 mt-auto font-medium">Требования: Назначен мастер</p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
