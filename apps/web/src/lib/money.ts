function localeFromLanguage(language: string | undefined): string {
  if (language === 'en') return 'en-US';
  if (language === 'uz-lat') return 'uz-UZ';
  if (language === 'uz-cyr') return 'uz-Cyrl-UZ';
  return 'ru-RU';
}

export function formatMoney(
  value: unknown,
  language: string | undefined,
  currency = 'UZS',
): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return `0 ${currency}`;
  }

  return `${amount.toLocaleString(localeFromLanguage(language))} ${currency}`;
}

export function formatCompactMoney(
  value: unknown,
  language: string | undefined,
  currency = 'UZS',
): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return `0 ${currency}`;
  }

  return `${new Intl.NumberFormat(localeFromLanguage(language), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)} ${currency}`;
}
