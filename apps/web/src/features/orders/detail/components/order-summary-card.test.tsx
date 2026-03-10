import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderSummaryCard } from './order-summary-card';
import type { Order } from '../types';

describe('OrderSummaryCard', () => {
  it('renders order totals, status and assigned masters', () => {
    const order: Order = {
      id: 'order-1',
      status: 'in_repair',
      order_date: '2026-03-06T00:00:00.000Z',
      total_price_uzs: 150000,
      deadline: '2026-03-10T00:00:00.000Z',
      price_approved_at: '2026-03-06T00:00:00.000Z',
      price_rejected_at: null,
      details: [
        { id: '1', status: 'assigned', attached_to: 'master-1' },
        { id: '2', status: 'new' },
      ],
    };

    render(<OrderSummaryCard order={order} currentStatus="in_repair" />);

    expect(screen.getByText('Информация о заказе')).toBeInTheDocument();
    expect(screen.getByText(/150.*UZS/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('В ремонте')).toBeInTheDocument();
  });
});
