import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderPaymentsCard } from './order-payments-card';

describe('OrderPaymentsCard', () => {
  it('renders payment progress, history and management actions', async () => {
    const user = userEvent.setup();
    const onStartEditPayment = vi.fn();

    render(
      <OrderPaymentsCard
        order={{
          id: 'order-1',
          status: 'approved',
          order_date: '2026-03-06T00:00:00.000Z',
          total_price_uzs: 200000,
          total_paid_uzs: 50000,
          payments: [
            {
              id: 'payment-1',
              paid_amount: 50000,
              payment_type: 'CASH',
              currency: 'UZS',
              created_at: '2026-03-06T00:00:00.000Z',
            },
          ],
        }}
        canManagePayments={true}
        editingPaymentId=""
        editingPaymentForm={{ amount: '', method: 'CASH' }}
        updatingPaymentId=""
        splitPaymentMode={false}
        paymentRows={[{ amount: '25000', method: 'CASH' }]}
        addingPayment={false}
        enteredPaymentTotal={25000}
        paymentNote=""
        paymentInputWarning=""
        remainingPayment={150000}
        onStartEditPayment={onStartEditPayment}
        onCancelEditPayment={() => {}}
        onUpdatePayment={() => {}}
        onEditingPaymentAmountChange={() => {}}
        onEditingPaymentMethodChange={() => {}}
        onToggleSplitPaymentMode={() => {}}
        onUpdatePaymentRow={() => {}}
        onRemovePaymentRow={() => {}}
        onAddPaymentRow={() => {}}
        onPaymentNoteChange={() => {}}
        onAddPayment={() => {}}
        paymentMethodLabel={() => 'Наличные'}
      />,
    );

    expect(screen.getByText('Оплата')).toBeInTheDocument();
    expect(screen.getByText(/50.*200.*UZS/)).toBeInTheDocument();
    expect(screen.getByText('История платежей')).toBeInTheDocument();
    expect(screen.getByText(/Остаток к оплате:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Изменить' }));

    expect(onStartEditPayment).toHaveBeenCalledWith(expect.objectContaining({ id: 'payment-1' }));
  });
});
