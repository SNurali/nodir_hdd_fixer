"use client";

import React from 'react';
import { useI18n } from '@/i18n/provider';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Search,
  Hammer,
  PackageCheck,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface StatusHintMeta {
  icon: React.ComponentType<any>;
  color: string;
  steps: number;
  // Pre-computed Tailwind classes to avoid dynamic class issues
  classes: {
    compactBg: string;
    compactBorder: string;
    compactText: string;
    compactIcon: string;
    fullBg: string;
    fullBorder: string;
    fullBadgeBg: string;
    fullBadgeIcon: string;
    fullTitleText: string;
    dotBg: string;
  };
}

const STATUS_HINTS: Record<string, StatusHintMeta> = {
  new: {
    icon: Clock,
    color: 'purple',
    steps: 3,
    classes: {
      compactBg: 'bg-purple-50 dark:bg-purple-900/20',
      compactBorder: 'border-purple-200 dark:border-purple-800',
      compactText: 'text-purple-700 dark:text-purple-300',
      compactIcon: 'text-purple-600 dark:text-purple-400',
      fullBg: 'bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20',
      fullBorder: 'border-purple-200 dark:border-purple-800',
      fullBadgeBg: 'bg-purple-100 dark:bg-purple-900/30',
      fullBadgeIcon: 'text-purple-600 dark:text-purple-400',
      fullTitleText: 'text-purple-700 dark:text-purple-300',
      dotBg: 'bg-purple-500',
    },
  },
  assigned: {
    icon: UserCheck,
    color: 'blue',
    steps: 3,
    classes: {
      compactBg: 'bg-blue-50 dark:bg-blue-900/20',
      compactBorder: 'border-blue-200 dark:border-blue-800',
      compactText: 'text-blue-700 dark:text-blue-300',
      compactIcon: 'text-blue-600 dark:text-blue-400',
      fullBg: 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20',
      fullBorder: 'border-blue-200 dark:border-blue-800',
      fullBadgeBg: 'bg-blue-100 dark:bg-blue-900/30',
      fullBadgeIcon: 'text-blue-600 dark:text-blue-400',
      fullTitleText: 'text-blue-700 dark:text-blue-300',
      dotBg: 'bg-blue-500',
    },
  },
  diagnosing: {
    icon: Search,
    color: 'cyan',
    steps: 4,
    classes: {
      compactBg: 'bg-cyan-50 dark:bg-cyan-900/20',
      compactBorder: 'border-cyan-200 dark:border-cyan-800',
      compactText: 'text-cyan-700 dark:text-cyan-300',
      compactIcon: 'text-cyan-600 dark:text-cyan-400',
      fullBg: 'bg-gradient-to-br from-white to-cyan-50 dark:from-gray-900 dark:to-cyan-900/20',
      fullBorder: 'border-cyan-200 dark:border-cyan-800',
      fullBadgeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
      fullBadgeIcon: 'text-cyan-600 dark:text-cyan-400',
      fullTitleText: 'text-cyan-700 dark:text-cyan-300',
      dotBg: 'bg-cyan-500',
    },
  },
  awaiting_approval: {
    icon: DollarSign,
    color: 'orange',
    steps: 3,
    classes: {
      compactBg: 'bg-orange-50 dark:bg-orange-900/20',
      compactBorder: 'border-orange-200 dark:border-orange-800',
      compactText: 'text-orange-700 dark:text-orange-300',
      compactIcon: 'text-orange-600 dark:text-orange-400',
      fullBg: 'bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-900/20',
      fullBorder: 'border-orange-200 dark:border-orange-800',
      fullBadgeBg: 'bg-orange-100 dark:bg-orange-900/30',
      fullBadgeIcon: 'text-orange-600 dark:text-orange-400',
      fullTitleText: 'text-orange-700 dark:text-orange-300',
      dotBg: 'bg-orange-500',
    },
  },
  approved: {
    icon: CheckCircle,
    color: 'green',
    steps: 3,
    classes: {
      compactBg: 'bg-green-50 dark:bg-green-900/20',
      compactBorder: 'border-green-200 dark:border-green-800',
      compactText: 'text-green-700 dark:text-green-300',
      compactIcon: 'text-green-600 dark:text-green-400',
      fullBg: 'bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/20',
      fullBorder: 'border-green-200 dark:border-green-800',
      fullBadgeBg: 'bg-green-100 dark:bg-green-900/30',
      fullBadgeIcon: 'text-green-600 dark:text-green-400',
      fullTitleText: 'text-green-700 dark:text-green-300',
      dotBg: 'bg-green-500',
    },
  },
  in_repair: {
    icon: Hammer,
    color: 'yellow',
    steps: 4,
    classes: {
      compactBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      compactBorder: 'border-yellow-200 dark:border-yellow-800',
      compactText: 'text-yellow-700 dark:text-yellow-300',
      compactIcon: 'text-yellow-600 dark:text-yellow-400',
      fullBg: 'bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-900/20',
      fullBorder: 'border-yellow-200 dark:border-yellow-800',
      fullBadgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      fullBadgeIcon: 'text-yellow-600 dark:text-yellow-400',
      fullTitleText: 'text-yellow-700 dark:text-yellow-300',
      dotBg: 'bg-yellow-500',
    },
  },
  ready_for_pickup: {
    icon: PackageCheck,
    color: 'emerald',
    steps: 3,
    classes: {
      compactBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      compactBorder: 'border-emerald-200 dark:border-emerald-800',
      compactText: 'text-emerald-700 dark:text-emerald-300',
      compactIcon: 'text-emerald-600 dark:text-emerald-400',
      fullBg: 'bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-900/20',
      fullBorder: 'border-emerald-200 dark:border-emerald-800',
      fullBadgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      fullBadgeIcon: 'text-emerald-600 dark:text-emerald-400',
      fullTitleText: 'text-emerald-700 dark:text-emerald-300',
      dotBg: 'bg-emerald-500',
    },
  },
  unrepairable: {
    icon: AlertCircle,
    color: 'red',
    steps: 3,
    classes: {
      compactBg: 'bg-red-50 dark:bg-red-900/20',
      compactBorder: 'border-red-200 dark:border-red-800',
      compactText: 'text-red-700 dark:text-red-300',
      compactIcon: 'text-red-600 dark:text-red-400',
      fullBg: 'bg-gradient-to-br from-white to-red-50 dark:from-gray-900 dark:to-red-900/20',
      fullBorder: 'border-red-200 dark:border-red-800',
      fullBadgeBg: 'bg-red-100 dark:bg-red-900/30',
      fullBadgeIcon: 'text-red-600 dark:text-red-400',
      fullTitleText: 'text-red-700 dark:text-red-300',
      dotBg: 'bg-red-500',
    },
  },
  issued: {
    icon: PackageCheck,
    color: 'teal',
    steps: 3,
    classes: {
      compactBg: 'bg-teal-50 dark:bg-teal-900/20',
      compactBorder: 'border-teal-200 dark:border-teal-800',
      compactText: 'text-teal-700 dark:text-teal-300',
      compactIcon: 'text-teal-600 dark:text-teal-400',
      fullBg: 'bg-gradient-to-br from-white to-teal-50 dark:from-gray-900 dark:to-teal-900/20',
      fullBorder: 'border-teal-200 dark:border-teal-800',
      fullBadgeBg: 'bg-teal-100 dark:bg-teal-900/30',
      fullBadgeIcon: 'text-teal-600 dark:text-teal-400',
      fullTitleText: 'text-teal-700 dark:text-teal-300',
      dotBg: 'bg-teal-500',
    },
  },
  cancelled: {
    icon: AlertCircle,
    color: 'gray',
    steps: 2,
    classes: {
      compactBg: 'bg-gray-50 dark:bg-gray-900/20',
      compactBorder: 'border-gray-200 dark:border-gray-800',
      compactText: 'text-gray-700 dark:text-gray-300',
      compactIcon: 'text-gray-600 dark:text-gray-400',
      fullBg: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/20',
      fullBorder: 'border-gray-200 dark:border-gray-800',
      fullBadgeBg: 'bg-gray-100 dark:bg-gray-900/30',
      fullBadgeIcon: 'text-gray-600 dark:text-gray-400',
      fullTitleText: 'text-gray-700 dark:text-gray-300',
      dotBg: 'bg-gray-500',
    },
  },
};

interface OrderStatusHintProps {
  status: string;
  userRole?: string | null;
  compact?: boolean;
}

export function OrderStatusHint({ status, compact }: OrderStatusHintProps) {
  const { t } = useI18n();
  const hint = STATUS_HINTS[status] || STATUS_HINTS.new;
  const normalizedStatus = STATUS_HINTS[status] ? status : 'new';
  const Icon = hint.icon;
  const c = hint.classes;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.compactBg} ${c.compactBorder}`}>
        <Icon size={16} className={c.compactIcon} />
        <span className={`text-sm font-medium ${c.compactText}`}>
          {t(`status_hints.statuses.${normalizedStatus}.title`)}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${c.fullBorder} ${c.fullBg} p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${c.fullBadgeBg}`}>
          <Icon size={24} className={c.fullBadgeIcon} />
        </div>

        <div className="flex-1">
          <h3 className={`text-lg font-bold ${c.fullTitleText} mb-2`}>
            {t(`status_hints.statuses.${normalizedStatus}.title`)}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t(`status_hints.statuses.${normalizedStatus}.description`)}
          </p>

          {hint.steps > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('status_hints.next_steps')}
                </span>
              </div>

              <ul className="space-y-1.5 ml-4">
                {Array.from({ length: hint.steps }).map((_, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${c.dotBg} flex-shrink-0`} />
                    {t(`status_hints.statuses.${normalizedStatus}.steps.${index}`)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RoleBasedHintsProps {
  status: string;
  userRole: string;
}

const ROLE_HINTS: Record<string, string[]> = {
  admin: ['new', 'assigned', 'awaiting_approval', 'approved'],
  operator: ['new', 'assigned', 'awaiting_approval'],
  master: ['assigned', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair'],
  client: ['awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup'],
};

export function RoleBasedHints({ status, userRole }: RoleBasedHintsProps) {
  const { t } = useI18n();
  const roleStatus = ROLE_HINTS[userRole]?.includes(status) ? status : null;

  if (!roleStatus) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Info size={20} className="text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
            {t(`status_hints.role_based.${userRole}.${roleStatus}.title`)}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
            {t(`status_hints.role_based.${userRole}.${roleStatus}.action`)}
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            {t(`status_hints.role_based.${userRole}.${roleStatus}.button`)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderStatusHint;
