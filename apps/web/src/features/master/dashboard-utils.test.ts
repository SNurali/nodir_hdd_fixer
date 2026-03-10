import { describe, expect, it, vi } from 'vitest';
import { filterMasterOrders, getMasterDailyProgress, getNextAssignedOrder } from './dashboard-utils';

describe('master dashboard utils', () => {
  it('hides terminal orders when completed jobs are disabled', () => {
    const result = filterMasterOrders([
      { id: '1', status: 'assigned' },
      { id: '2', status: 'ready_for_pickup' },
      { id: '3', status: 'cancelled' },
    ], false);

    expect(result.map((order) => order.id)).toEqual(['1']);
  });

  it('calculates daily target progress from orders completed today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T12:00:00Z'));

    const progress = getMasterDailyProgress([
      { id: '1', status: 'ready_for_pickup', updated_at: '2026-03-06T08:00:00Z' },
      { id: '2', status: 'issued', updated_at: '2026-03-06T10:00:00Z' },
      { id: '3', status: 'assigned', updated_at: '2026-03-06T09:00:00Z' },
    ], 5);

    expect(progress.completedToday).toBe(2);
    expect(progress.remaining).toBe(3);
    expect(progress.percent).toBe(40);

    vi.useRealTimers();
  });

  it('returns next actionable assignment first', () => {
    const nextOrder = getNextAssignedOrder([
      { id: '1', status: 'issued' },
      { id: '2', status: 'diagnosing' },
      { id: '3', status: 'ready_for_pickup' },
    ]);

    expect(nextOrder?.id).toBe('2');
  });
});
