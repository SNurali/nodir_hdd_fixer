import {
  checkRequirementsMet,
  getOrderProgressPercentage,
  getStatusDescription,
  normalizePaymentMethod,
  paymentMethodLabel,
} from './utils';

describe('order detail utils', () => {
  it('returns human-readable status description and progress', () => {
    expect(getStatusDescription('awaiting_approval')).toContain('ожидается одобрение');
    expect(getOrderProgressPercentage('in_repair')).toBe(75);
  });

  it('checks transition requirements against order data', () => {
    const order = {
      details: [{ attached_to: 'master-1' }],
      price_approved_at: '2026-03-06T10:00:00Z',
      total_price_uzs: 500000,
      total_paid_uzs: 500000,
    };

    expect(checkRequirementsMet({ requirements: ['Мастер назначен', 'Цена одобрена', 'Оплата подтверждена'] }, order)).toBe(true);
    expect(checkRequirementsMet({ requirements: ['Оплата подтверждена'] }, { total_price_uzs: 500000, total_paid_uzs: 100000 })).toBe(false);
  });

  it('maps payment labels and normalizes unknown methods', () => {
    expect(paymentMethodLabel('CLICK')).toBe('Click');
    expect(normalizePaymentMethod('UNKNOWN')).toBe('CASH');
    expect(normalizePaymentMethod('PAYME')).toBe('PAYME');
  });
});
