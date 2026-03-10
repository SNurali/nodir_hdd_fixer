const TERMINAL_STATUSES = new Set(['ready_for_pickup', 'issued', 'unrepairable', 'cancelled']);

function isToday(value: unknown): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  return parsed.getFullYear() === today.getFullYear()
    && parsed.getMonth() === today.getMonth()
    && parsed.getDate() === today.getDate();
}

export function filterMasterOrders<T extends Record<string, any>>(orders: T[], showCompletedJobs: boolean): T[] {
  if (showCompletedJobs) {
    return orders;
  }

  return orders.filter((order) => !TERMINAL_STATUSES.has(String(order.status)));
}

export function getMasterDailyProgress<T extends Record<string, any>>(orders: T[], target: number) {
  const completedToday = orders.filter((order) => (
    TERMINAL_STATUSES.has(String(order.status))
    && isToday(order.updated_at || order.completed_at || order.order_date)
  )).length;

  const safeTarget = Math.max(1, Number(target) || 1);

  return {
    completedToday,
    target: safeTarget,
    remaining: Math.max(0, safeTarget - completedToday),
    percent: Math.min(100, Math.round((completedToday / safeTarget) * 100)),
  };
}

export function getNextAssignedOrder<T extends Record<string, any>>(orders: T[]): T | null {
  return orders.find((order) => !TERMINAL_STATUSES.has(String(order.status))) || orders[0] || null;
}
