import { History } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';

interface OrderLifecycleCardProps {
  entries: any[];
}

export function OrderLifecycleCard({ entries }: OrderLifecycleCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <History size={24} className="text-blue-500" />
        История изменений
      </h2>
      <OrderTimeline entries={entries} />
    </div>
  );
}
