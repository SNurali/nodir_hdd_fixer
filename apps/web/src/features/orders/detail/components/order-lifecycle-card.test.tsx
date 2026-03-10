import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderLifecycleCard } from './order-lifecycle-card';

vi.mock('@/components/order-timeline', () => ({
  OrderTimeline: ({ entries }: { entries: any[] }) => <div>Timeline entries: {entries.length}</div>,
}));

describe('OrderLifecycleCard', () => {
  it('renders lifecycle title and timeline', () => {
    render(<OrderLifecycleCard entries={[{ id: '1' }, { id: '2' }]} />);

    expect(screen.getByText('История изменений')).toBeInTheDocument();
    expect(screen.getByText('Timeline entries: 2')).toBeInTheDocument();
  });
});
