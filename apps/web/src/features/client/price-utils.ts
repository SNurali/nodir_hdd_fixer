export function formatClientPriceDisplay(
  amount: unknown,
  currencyRateUsd: unknown,
  showPricesInUsd: boolean,
): string {
  const total = Number(amount || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return '';
  }

  const base = `${total.toLocaleString()} UZS`;
  if (!showPricesInUsd) {
    return base;
  }

  const rate = Number(currencyRateUsd || 0);
  if (!Number.isFinite(rate) || rate <= 0) {
    return base;
  }

  return `${base} (~$${(total / rate).toFixed(2)})`;
}
