import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderPricingCard } from './order-pricing-card';

describe('OrderPricingCard', () => {
  it('renders set-price and update-price actions', async () => {
    const user = userEvent.setup();
    const onSetPrice = vi.fn();
    const onUpdatePrice = vi.fn();

    render(
      <OrderPricingCard
        order={{
          id: 'order-1',
          status: 'diagnosing',
          order_date: '2026-03-06T00:00:00.000Z',
          total_price_uzs: 100000,
          details: [{ id: 'detail-1', status: 'diagnosing', equipment: { name_rus: 'HDD' }, issue: { name_rus: 'Bad sectors' } }],
        }}
        isVisible={true}
        isUpdateVisible={true}
        pricesForm={{ 'detail-1': '50000' }}
        settingPrice={false}
        updatePriceForm={{ amount: '25000', reason: 'Деталь' }}
        updatingPrice={false}
        setPriceTitle="Установить цену"
        pricePerItemLabel="Цена за позицию"
        itemsTotalLabel="Итого"
        onPriceChange={() => {}}
        onSetPrice={onSetPrice}
        onUpdatePriceFormChange={() => {}}
        onUpdatePrice={onUpdatePrice}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Установить/ }));
    expect(onSetPrice).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Добавить к цене/ }));
    expect(onUpdatePrice).toHaveBeenCalledWith('add');
  });
});
