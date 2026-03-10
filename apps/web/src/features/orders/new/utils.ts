import { HardDrive } from 'lucide-react';
import { EQUIPMENT_ICONS } from './constants';
import type { ClientProfileSnapshot, OrderItemDraft } from './types';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeTelegram(value: string): string {
  return value.trim();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return phone.trim();
}

export function getContactDiffState(
  form: { full_name: string; phone: string; telegram: string },
  snapshot: ClientProfileSnapshot | null,
): boolean {
  if (!snapshot) return false;

  const formPhone = normalizePhone(form.phone || '');
  const profilePhone = normalizePhone(snapshot.phone || '');

  return (
    (form.full_name || '').trim() !== (snapshot.full_name || '').trim() ||
    formPhone !== profilePhone ||
    normalizeTelegram(form.telegram || '') !== normalizeTelegram(snapshot.telegram || '')
  );
}

export function selectPrimaryServiceId(serviceList: Array<{ id?: string }> | undefined | null): string | null {
  if (!Array.isArray(serviceList) || serviceList.length === 0) {
    return null;
  }

  return UUID_REGEX.test(serviceList[0]?.id || '') ? (serviceList[0]?.id || null) : null;
}

export function validateOrderDraftIds(detailsForOrder: OrderItemDraft[]): boolean {
  return detailsForOrder.every((item) => UUID_REGEX.test(item.equipment_id) && UUID_REGEX.test(item.issue_id));
}

export function buildOrderPayload(params: {
  preferredLanguage: string;
  detailsForOrder: OrderItemDraft[];
  serviceId: string;
  isClientRole: boolean;
  fullName: string;
  telegram: string;
  phone: string;
}) {
  const payload: Record<string, unknown> = {
    language: params.preferredLanguage,
    details: params.detailsForOrder.map((item) => ({
      service_id: params.serviceId,
      equipment_id: item.equipment_id,
      issue_id: item.issue_id,
      description_of_issue: item.description || 'Без описания',
    })),
  };

  if (!params.isClientRole) {
    const trimmedName = params.fullName.trim();
    const trimmedTelegram = normalizeTelegram(params.telegram || '');

    payload.guest_name = trimmedName.length >= 2 ? trimmedName : 'Клиент';
    payload.guest_phone = params.phone;

    if (trimmedTelegram) {
      payload.guest_telegram = trimmedTelegram;
    }
  }

  return payload;
}

export function resolveEntityNameById(
  items: Array<Record<string, any>>,
  itemId: string,
  fallback = 'Не выбрано',
): string {
  const item = items.find((entity) => entity.id === itemId);
  return getEntityDisplayName(item, fallback);
}

export function getEquipmentIconForItem(equipment: Record<string, any>) {
  const nameLower = getEntityDisplayName(equipment, '').toLowerCase();
  for (const [key, Icon] of Object.entries(EQUIPMENT_ICONS)) {
    if (nameLower.includes(key)) {
      return Icon;
    }
  }
  return HardDrive;
}

export function getEntityDisplayName(item: unknown, fallback = 'Не выбрано'): string {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return fallback;
  }

  const entity = item as Record<string, unknown>;
  const localizedName = [entity.name_rus, entity.name_ru, entity.name_eng, entity.name_en].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  return typeof localizedName === 'string' ? localizedName : fallback;
}
