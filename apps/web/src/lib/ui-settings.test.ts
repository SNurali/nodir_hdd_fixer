import { describe, expect, it } from 'vitest';
import { DEFAULT_UI_SETTINGS, formatAppDate, formatAppDateTime } from './ui-settings';

describe('ui-settings formatting', () => {
  const value = '2026-03-06T18:30:00.000Z';

  it('formats date as dd.mm.yyyy', () => {
    expect(formatAppDate(value, DEFAULT_UI_SETTINGS, 'ru-RU')).toBe('06.03.2026');
  });

  it('formats date as mm/dd/yyyy', () => {
    expect(
      formatAppDate(value, { ...DEFAULT_UI_SETTINGS, date_format: 'mm/dd/yyyy' }, 'en-US'),
    ).toBe('03/06/2026');
  });

  it('formats date as yyyy-mm-dd', () => {
    expect(
      formatAppDate(value, { ...DEFAULT_UI_SETTINGS, date_format: 'yyyy-mm-dd' }, 'ru-RU'),
    ).toBe('2026-03-06');
  });

  it('uses timezone in datetime formatting', () => {
    expect(
      formatAppDateTime(value, { ...DEFAULT_UI_SETTINGS, timezone: 'Asia/Tashkent' }, 'ru-RU'),
    ).toBe('06.03.2026 23:30');
  });
});
