import {
  buildOrderPayload,
  getContactDiffState,
  getEntityDisplayName,
  normalizePhone,
  selectPrimaryServiceId,
  validateOrderDraftIds,
} from './utils';

describe('order form utils', () => {
  it('normalizes local phone input into +998 format', () => {
    expect(normalizePhone('90 123 45 67')).toBe('+998901234567');
    expect(normalizePhone('+998901234567')).toBe('+998901234567');
  });

  it('detects contact diff against profile snapshot', () => {
    const snapshot = {
      full_name: 'Ali Valiyev',
      phone: '+998901234567',
      telegram: '@ali',
      preferred_language: 'ru',
    };

    expect(getContactDiffState({
      full_name: 'Ali Valiyev',
      phone: '90 123 45 67',
      telegram: '@ali',
    }, snapshot)).toBe(false);

    expect(getContactDiffState({
      full_name: 'Ali Valiyev',
      phone: '+998901234567',
      telegram: '@newali',
    }, snapshot)).toBe(true);
  });

  it('selects only valid UUID service ids', () => {
    expect(selectPrimaryServiceId([{ id: 'invalid-id' }])).toBeNull();
    expect(selectPrimaryServiceId([{ id: '123e4567-e89b-12d3-a456-426614174000' }])).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('extracts only string display names from entity objects', () => {
    expect(
      getEntityDisplayName({
        id: 'svc-1',
        name_rus: 'Диагностика',
        name_eng: 'Diagnostics',
      }),
    ).toBe('Диагностика');

    expect(
      getEntityDisplayName({
        id: 'svc-2',
        name_rus: { bad: true },
        name_eng: null,
      }, 'fallback'),
    ).toBe('fallback');
  });

  it('validates draft ids for equipment and issue references', () => {
    expect(validateOrderDraftIds([
      {
        equipment_id: '123e4567-e89b-12d3-a456-426614174000',
        issue_id: '123e4567-e89b-12d3-a456-426614174001',
        description: 'Broken drive',
      },
    ])).toBe(true);

    expect(validateOrderDraftIds([
      {
        equipment_id: 'bad-id',
        issue_id: '123e4567-e89b-12d3-a456-426614174001',
        description: 'Broken drive',
      },
    ])).toBe(false);
  });

  it('builds guest order payload with contact hints', () => {
    expect(buildOrderPayload({
      preferredLanguage: 'ru',
      detailsForOrder: [
        {
          equipment_id: '123e4567-e89b-12d3-a456-426614174000',
          issue_id: '123e4567-e89b-12d3-a456-426614174001',
          description: 'Broken drive',
        },
      ],
      serviceId: '123e4567-e89b-12d3-a456-426614174999',
      isClientRole: false,
      fullName: 'Ali Valiyev',
      telegram: '@ali',
      phone: '+998901234567',
    })).toEqual({
      language: 'ru',
      details: [
        {
          service_id: '123e4567-e89b-12d3-a456-426614174999',
          equipment_id: '123e4567-e89b-12d3-a456-426614174000',
          issue_id: '123e4567-e89b-12d3-a456-426614174001',
          description_of_issue: 'Broken drive',
        },
      ],
      guest_name: 'Ali Valiyev',
      guest_phone: '+998901234567',
      guest_telegram: '@ali',
    });
  });
});
