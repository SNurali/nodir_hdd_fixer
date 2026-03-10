import { PAYMENT_METHOD_OPTIONS, STATUS_CONFIG } from './constants';
import type { OrderStatus, PaymentMethod } from './types';

export function getStatusDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    new: 'Новый заказ, ожидает назначения мастера',
    assigned: 'Мастер назначен',
    diagnosing: 'Проводится диагностика',
    awaiting_approval: 'Цена выставлена, ожидается одобрение клиента',
    approved: 'Цена одобрена клиентом',
    in_repair: 'Выполняется ремонт',
    ready_for_pickup: 'Ремонт завершён, заказ готов к выдаче',
    unrepairable: 'Ремонт невозможен',
    issued: 'Выдан клиенту',
    cancelled: 'Заказ отменён',
  };

  return descriptions[status] || status;
}

export function getOrderProgressPercentage(status: OrderStatus): number {
  const progress: Record<OrderStatus, number> = {
    new: 0,
    assigned: 15,
    diagnosing: 30,
    awaiting_approval: 45,
    approved: 60,
    in_repair: 75,
    ready_for_pickup: 90,
    unrepairable: 90,
    issued: 100,
    cancelled: 100,
  };

  return progress[status] || 0;
}

export function isRequirementMet(requirement: string, order: any): boolean {
  if (requirement.includes('Мастер назначен')) {
    return order?.details?.some((detail: any) => detail.attached_to) || false;
  }
  if (requirement.includes('Цена согласована') || requirement.includes('Цена одобрена')) {
    return !!order?.price_approved_at;
  }
  if (requirement.includes('Цена установлена')) {
    return Number(order?.total_price_uzs || 0) > 0;
  }
  if (requirement.includes('Оплата подтверждена')) {
    return Number(order?.total_paid_uzs || 0) >= Number(order?.total_price_uzs || 0);
  }

  return true;
}

export function checkRequirementsMet(transition: any, order: any): boolean {
  if (!transition?.requirements || transition.requirements.length === 0) {
    return true;
  }

  return transition.requirements.every((requirement: string) => isRequirementMet(requirement, order));
}

export function paymentMethodLabel(paymentType: string): string {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === paymentType)?.label || paymentType;
}

export function normalizePaymentMethod(paymentType: string): PaymentMethod {
  return (PAYMENT_METHOD_OPTIONS.some((option) => option.value === paymentType)
    ? paymentType
    : 'CASH') as PaymentMethod;
}

export function getStatusBadgeColor(color?: string): string {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    sky: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  };

  return colorMap[color || 'blue'] || colorMap.blue;
}

export function getStatusConfig(status: OrderStatus) {
  return STATUS_CONFIG[status];
}
