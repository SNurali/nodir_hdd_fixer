import { describe, expect, it } from 'vitest';
import { formatCompactMoney, formatMoney } from './money';

describe('money utils', () => {
  it('formats regular money with locale-aware grouping', () => {
    expect(formatMoney(1250000, 'ru')).toBe('1 250 000 UZS');
  });

  it('formats compact money', () => {
    expect(formatCompactMoney(1250000, 'en')).toBe('1.3M UZS');
  });

  it('falls back safely for invalid values', () => {
    expect(formatMoney('bad-value', 'ru')).toBe('0 UZS');
  });
});
