import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderWorkDetailsCard } from './order-work-details-card';
import type { OrderDetail } from '../types';

describe('OrderWorkDetailsCard', () => {
  it('renders details progress and calls complete handler', async () => {
    const user = userEvent.setup();
    const onCompleteDetail = vi.fn();
    const details: OrderDetail[] = [
      {
        id: 'detail-1',
        status: 'in_repair',
        equipment: { name_rus: 'HDD' },
        issue: { name_rus: 'Bad sectors' },
        price: 50000,
        master: { full_name: 'Мастер 1' },
      },
      {
        id: 'detail-2',
        status: 'ready_for_pickup',
        equipment: { name_rus: 'SSD' },
        issue: { name_rus: 'Controller' },
        is_completed: 1,
      },
    ];

    render(
      <OrderWorkDetailsCard
        details={details}
        canManageDetails={true}
        canCompleteDetails={true}
        completingDetail=""
        onCompleteDetail={onCompleteDetail}
      />,
    );

    expect(screen.getByText(/Работы по заказу \(1\/2 выполнено\)/)).toBeInTheDocument();
    expect(screen.getByText('HDD')).toBeInTheDocument();
    expect(screen.getByText('Готово')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выполнено' }));

    expect(onCompleteDetail).toHaveBeenCalledWith('detail-1');
  });
});
