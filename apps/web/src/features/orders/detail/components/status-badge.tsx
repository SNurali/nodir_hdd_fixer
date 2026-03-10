"use client";

import { Clock } from 'lucide-react';
import type { OrderStatus } from '../types';
import { getStatusConfig } from '../utils';

export function StatusBadge({ status, variant = 'badge' }: { status: OrderStatus; variant?: 'badge' | 'button' }) {
  const config = getStatusConfig(status);
  const Icon = config?.icon || Clock;

  if (variant === 'button') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-medium transition-colors ${config?.activeBg || 'bg-gray-600'} text-white ${config?.activeBorder || 'border-gray-600'}`}
      >
        <Icon size={18} />
        {config?.label || status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-medium transition-colors ${config?.badgeBg || 'bg-gray-100'} ${config?.badgeText || 'text-gray-700'} ${config?.badgeBorder || 'border-gray-200'}`}
    >
      <Icon size={18} />
      {config?.label || status}
    </span>
  );
}
