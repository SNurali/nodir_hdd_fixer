import { extractOrders, getStatusColor } from './utils';

describe('dashboard utils', () => {
  it('extracts orders from multiple payload shapes', () => {
    expect(extractOrders([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(extractOrders({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(extractOrders({ items: [{ id: 3 }] })).toEqual([{ id: 3 }]);
    expect(extractOrders({ data: { items: [{ id: 4 }] } })).toEqual([{ id: 4 }]);
  });

  it('returns status color classes by theme', () => {
    expect(getStatusColor('light', 'approved')).toContain('green');
    expect(getStatusColor('dark', 'cancelled')).toContain('gray');
  });
});
