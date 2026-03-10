import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderStatusManagementCard } from './order-status-management-card';

describe('OrderStatusManagementCard', () => {
  it('renders transitions and calls status change handler', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <OrderStatusManagementCard
        order={{
          id: 'order-1',
          status: 'assigned',
          order_date: '2026-03-06T00:00:00.000Z',
          total_price_uzs: 100000,
          total_paid_uzs: 0,
          details: [{ id: 'detail-1', status: 'assigned', attached_to: 'master-1' }],
        }}
        currentStatus="assigned"
        allowedTransitions={[
          { to: 'diagnosing', requirements: ['Мастер назначен'] },
          { to: 'issued', requirements: ['Оплата подтверждена'] },
        ]}
        actionLoading=""
        message="✅ Статус обновлён"
        requireStatusComment
        statusComment="Нужно ускорить обработку"
        onStatusCommentChange={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText('Управление статусом')).toBeInTheDocument();
    expect(screen.getByText('Статус обновлён')).toBeInTheDocument();
    expect(screen.getByLabelText('Комментарий к смене статуса')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Диагностика' }));
    expect(onStatusChange).toHaveBeenCalledWith('diagnosing', 'Нужно ускорить обработку');

    expect(screen.getByRole('button', { name: 'Выдан' })).toBeDisabled();
  });
});
