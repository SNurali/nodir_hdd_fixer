import type { ComponentType } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Hammer,
  PackageCheck,
  Search,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { OrderStatus, PaymentMethod } from './types';

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Наличные' },
  { value: 'UZCARD', label: 'Карта (UZCARD)' },
  { value: 'HUMO', label: 'Карта (HUMO)' },
  { value: 'VISA', label: 'Карта (VISA)' },
  { value: 'CLICK', label: 'Click' },
  { value: 'PAYME', label: 'Payme' },
  { value: 'PAYNET', label: 'Paynet' },
  { value: 'UZUM', label: 'Uzum' },
  { value: 'FREE', label: 'Бесплатно' },
];

export const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    icon: ComponentType<any>;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    activeBg: string;
    activeBorder: string;
  }
> = {
  new: {
    label: 'В ожидании',
    color: 'purple',
    icon: Clock,
    description: 'Заказ создан и ожидает назначения мастера.',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    activeBg: 'bg-purple-600',
    activeBorder: 'border-purple-600',
  },
  assigned: {
    label: 'Назначен',
    color: 'blue',
    icon: UserCheck,
    description: 'Мастер назначен, можно начинать диагностику.',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    activeBg: 'bg-blue-600',
    activeBorder: 'border-blue-600',
  },
  diagnosing: {
    label: 'Диагностика',
    color: 'cyan',
    icon: Search,
    description: 'Мастер проводит диагностику и формирует стоимость.',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
    activeBg: 'bg-cyan-600',
    activeBorder: 'border-cyan-600',
  },
  awaiting_approval: {
    label: 'Ожидает одобрения',
    color: 'orange',
    icon: DollarSign,
    description: 'Цена выставлена и ждёт подтверждения клиента.',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/30',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    activeBg: 'bg-orange-600',
    activeBorder: 'border-orange-600',
  },
  approved: {
    label: 'Одобрено',
    color: 'green',
    icon: CheckCircle2,
    description: 'Клиент подтвердил цену и готов оплатить.',
    badgeBg: 'bg-green-100 dark:bg-green-900/30',
    badgeText: 'text-green-700 dark:text-green-300',
    badgeBorder: 'border-green-200 dark:border-green-800',
    activeBg: 'bg-green-600',
    activeBorder: 'border-green-600',
  },
  in_repair: {
    label: 'В ремонте',
    color: 'yellow',
    icon: Hammer,
    description: 'Выполняются ремонтные работы.',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
    activeBg: 'bg-yellow-600',
    activeBorder: 'border-yellow-600',
  },
  ready_for_pickup: {
    label: 'Готов к выдаче',
    color: 'emerald',
    icon: PackageCheck,
    description: 'Работы завершены, заказ готов к выдаче.',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    activeBg: 'bg-emerald-600',
    activeBorder: 'border-emerald-600',
  },
  issued: {
    label: 'Выдан',
    color: 'emerald',
    icon: PackageCheck,
    description: 'Заказ закрыт. Оплата подтверждена, оборудование возвращено клиенту.',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    activeBg: 'bg-emerald-600',
    activeBorder: 'border-emerald-600',
  },
  unrepairable: {
    label: 'Неремонтопригоден',
    color: 'red',
    icon: XCircle,
    description: 'Ремонт невозможен из-за состояния устройства.',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-800',
    activeBg: 'bg-red-600',
    activeBorder: 'border-red-600',
  },
  cancelled: {
    label: 'Отменён',
    color: 'gray',
    icon: XCircle,
    description: 'Заказ был отменён.',
    badgeBg: 'bg-gray-100 dark:bg-gray-900/30',
    badgeText: 'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-200 dark:border-gray-800',
    activeBg: 'bg-gray-600',
    activeBorder: 'border-gray-600',
  },
};
