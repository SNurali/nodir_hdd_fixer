import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderPriceHistoryCard } from './order-price-history-card';

describe('OrderPriceHistoryCard', () => {
  it('renders records and toggles history loading CTA', async () => {
    const user = userEvent.setup();
    const onShow = vi.fn();

    render(
      <OrderPriceHistoryCard
        records={[
          {
            id: 'history-1',
            old_price: 50000,
            new_price: 75000,
            changed_at: '2026-03-06T00:00:00.000Z',
            reason: 'Замена контроллера',
            user: { full_name: 'Admin' },
          },
        ]}
        loading={false}
        visible={false}
        title="История цен"
        emptyLabel="История пуста"
        onShow={onShow}
        onHide={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Показать историю' }));
    expect(onShow).toHaveBeenCalled();
  });
});
