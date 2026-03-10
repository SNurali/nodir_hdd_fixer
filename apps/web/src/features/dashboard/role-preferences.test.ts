import { describe, expect, it } from 'vitest';
import { getOrderRefreshInterval, sortOrdersForQueue } from './role-preferences';

describe('dashboard role preferences', () => {
  it('sorts operator queue by deadline first when configured', () => {
    const result = sortOrdersForQueue([
      { id: 'late', deadline: '2026-03-10T10:00:00Z', created_at: '2026-03-01T10:00:00Z' },
      { id: 'soon', deadline: '2026-03-08T10:00:00Z', created_at: '2026-03-02T10:00:00Z' },
    ], 'deadline_first');

    expect(result.map((order) => order.id)).toEqual(['soon', 'late']);
  });

  it('prioritizes urgent statuses before recency in priority mode', () => {
    const result = sortOrdersForQueue([
      { id: 'new-order', status: 'new', created_at: '2026-03-05T10:00:00Z' },
      { id: 'approval-order', status: 'awaiting_approval', created_at: '2026-03-01T10:00:00Z' },
    ], 'priority_first');

    expect(result.map((order) => order.id)).toEqual(['approval-order', 'new-order']);
  });

  it('returns refresh interval only for operator role', () => {
    expect(getOrderRefreshInterval('operator', 45)).toBe(45000);
    expect(getOrderRefreshInterval('client', 45)).toBe(0);
    expect(getOrderRefreshInterval('operator', 3)).toBe(60000);
  });
});
