export type UiDateFormat = 'dd.mm.yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';

export interface UiSettings {
  compact_mode: boolean;
  timezone: string;
  date_format: UiDateFormat;
}

export const DEFAULT_UI_SETTINGS: UiSettings = {
  compact_mode: false,
  timezone: 'Asia/Tashkent',
  date_format: 'dd.mm.yyyy',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getDateParts(value: string | Date, timezone: string, locale: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
    hour: byType.hour,
    minute: byType.minute,
    second: byType.second,
  };
}

export function formatAppDate(
  value: string | Date | null | undefined,
  settings: UiSettings,
  locale: string,
): string {
  if (!value) return '—';
  const parts = getDateParts(value, settings.timezone, locale);
  if (!parts) return '—';

  if (settings.date_format === 'mm/dd/yyyy') {
    return `${parts.month}/${parts.day}/${parts.year}`;
  }

  if (settings.date_format === 'yyyy-mm-dd') {
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  return `${parts.day}.${parts.month}.${parts.year}`;
}

export function formatAppDateTime(
  value: string | Date | null | undefined,
  settings: UiSettings,
  locale: string,
): string {
  if (!value) return '—';
  const parts = getDateParts(value, settings.timezone, locale);
  if (!parts) return '—';
  return `${formatAppDate(value, settings, locale)} ${pad(Number(parts.hour))}:${pad(Number(parts.minute))}`;
}

export function formatAppTime(
  value: string | Date | null | undefined,
  settings: UiSettings,
  locale: string,
): string {
  if (!value) return '—';
  const parts = getDateParts(value, settings.timezone, locale);
  if (!parts) return '—';
  return `${pad(Number(parts.hour))}:${pad(Number(parts.minute))}`;
}
