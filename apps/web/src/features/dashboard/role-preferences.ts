export type QueueSortMode = 'new_first' | 'deadline_first' | 'priority_first';

const STATUS_PRIORITY: Record<string, number> = {
  awaiting_approval: 0,
  ready_for_pickup: 1,
  assigned: 2,
  diagnosing: 3,
  approved: 4,
  in_repair: 5,
  new: 6,
  issued: 7,
  unrepairable: 8,
  cancelled: 9,
};

function getComparableDate(value: unknown): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortOrdersForQueue<T extends Record<string, any>>(orders: T[], mode: QueueSortMode): T[] {
  const list = [...orders];

  return list.sort((left, right) => {
    if (mode === 'deadline_first') {
      const deadlineDiff = getComparableDate(left.deadline) - getComparableDate(right.deadline);
      if (deadlineDiff !== 0) {
        return deadlineDiff;
      }
    }

    if (mode === 'priority_first') {
      const leftPriority = STATUS_PRIORITY[left.status] ?? 999;
      const rightPriority = STATUS_PRIORITY[right.status] ?? 999;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
    }

    const rightDate = getComparableDate(right.created_at || right.order_date);
    const leftDate = getComparableDate(left.created_at || left.order_date);
    return rightDate - leftDate;
  });
}

export function getOrderRefreshInterval(role: string | null | undefined, autoRefreshSeconds: unknown): number {
  if (role !== 'operator') {
    return 0;
  }

  const value = Number(autoRefreshSeconds);
  if (!Number.isFinite(value) || value < 10) {
    return 60000;
  }

  return value * 1000;
}
