import { describe, expect, it } from 'vitest';
import { formatClientPriceDisplay } from './price-utils';

describe('client price utils', () => {
  it('formats UZS price by default', () => {
    expect(formatClientPriceDisplay(125000, 12500, false)).toBe('125,000 UZS');
  });

  it('adds USD approximation when enabled and rate exists', () => {
    expect(formatClientPriceDisplay(250000, 12500, true)).toBe('250,000 UZS (~$20.00)');
  });

  it('falls back to UZS when exchange rate is missing', () => {
    expect(formatClientPriceDisplay(250000, 0, true)).toBe('250,000 UZS');
  });
});
