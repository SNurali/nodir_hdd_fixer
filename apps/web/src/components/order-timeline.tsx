"use client";

import React from 'react';
import { useI18n } from '@/i18n/provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { formatMoney } from '@/lib/money';
import { Clock, CheckCircle, AlertCircle, User, DollarSign, MessageSquare } from 'lucide-react';

interface TimelineEntry {
    id: string;
    action_type: string | null;
    comments: string;
    comments_en?: string | null; // English translation from DB
    comments_uz?: string | null; // Uzbek translation from DB
    metadata?: {
        field_name?: string;
        old_value?: any;
        new_value?: any;
        reason?: string;
        master_name?: string;
        [key: string]: any;
    };
    creator: {
        full_name: string;
    };
    created_at: string;
}

interface OrderTimelineProps {
    entries: TimelineEntry[];
    isLoading?: boolean;
}

const ACTION_ICONS: Record<string, React.ComponentType<any>> = {
    status_change: Clock,
    price_set: DollarSign,
    master_assigned: User,
    price_approved: CheckCircle,
    price_rejected: AlertCircle,
    order_created: MessageSquare,
    order_closed: Clock,
    deadline_changed: Clock,
    price_updated: DollarSign,
    item_completed: CheckCircle,
    note: MessageSquare,
};

const ACTION_COLORS: Record<string, string> = {
    status_change: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    price_set: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    master_assigned: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    price_approved: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    price_rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    order_created: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    order_closed: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    deadline_changed: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    price_updated: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    item_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    note: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

export function OrderTimeline({ entries, isLoading }: OrderTimelineProps) {
    const { t, language } = useI18n();
    const { formatDateTime } = useAppSettings();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!entries || entries.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('timeline.empty')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry, index) => {
                const actionType = normalizeActionType(entry.action_type);
                const Icon = ACTION_ICONS[actionType] || Clock;
                const colorClass = ACTION_COLORS[actionType] || ACTION_COLORS.status_change;
                const label = t(`timeline.labels.${actionType}`);

                return (
                    <div key={entry.id} className="relative flex gap-4">
                        {/* Line */}
                        {index !== entries.length - 1 && (
                            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}

                        {/* Icon */}
                        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon size={20} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {label}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatDateTime(entry.created_at)}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                                {getComment(entry, language, t)}
                            </p>

                            {entry.creator && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {entry.creator.full_name}
                                </p>
                            )}

                            {/* Metadata */}
                            {entry.metadata && (
                                <MetadataBlock metadata={entry.metadata} actionType={actionType} language={language} t={t} />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function normalizeActionType(actionType: string | null): string {
    if (!actionType || actionType === 'null') return 'status_change';
    return actionType;
}

function MetadataBlock({
    metadata,
    actionType,
    language,
    t,
}: {
    metadata: any;
    actionType: string;
    language?: string;
    t: (key: string, params?: Record<string, any>) => string;
}) {
    if (!metadata) return null;

    if (actionType === 'status_change' && metadata.old_value && metadata.new_value) {
        return (
            <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                    {formatStatus(metadata.old_value, t)}
                </span>
                <span className="text-gray-400">→</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-medium">
                    {formatStatus(metadata.new_value, t)}
                </span>
            </div>
        );
    }

    if (actionType === 'price_set' && metadata.new_value) {
        return (
            <div className="mt-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                    {metadata.old_value > 0
                        ? `${formatCurrency(metadata.old_value, language)} → `
                        : ''}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(metadata.new_value, language)}
                    </span>
                </span>
            </div>
        );
    }

    if (actionType === 'master_assigned' && metadata.master_name) {
        return (
            <div className="mt-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    👷 {metadata.master_name}
                </span>
            </div>
        );
    }

    if (actionType === 'price_rejected' && metadata.reason) {
        return (
            <div className="mt-2 text-xs">
                <span className="text-red-600 dark:text-red-400 italic">
                    {t('timeline.reason')}: {metadata.reason}
                </span>
            </div>
        );
    }

    if (actionType === 'price_updated' && metadata.new_value) {
        return (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                {t('timeline.total_price_changed', {
                    old: formatCurrency(metadata.old_value, language),
                    new: formatCurrency(metadata.new_value, language),
                })}
                {metadata.reason && (
                    <span className="block mt-1 text-gray-600 dark:text-gray-400 font-normal">
                        ({metadata.reason})
                    </span>
                )}
            </div>
        );
    }

    return null;
}

function formatStatus(status: string, t: (key: string) => string): string {
    return t(`statuses.${status}`);
}

function formatCurrency(amount: number, language?: string): string {
    return formatMoney(Number(amount || 0), language || 'ru', 'UZS');
}

function getComment(
    entry: TimelineEntry,
    language: string | undefined,
    t: (key: string, params?: Record<string, any>) => string,
): string {
    if (language === 'en' && entry.comments_en) {
        return entry.comments_en;
    }
    if (language?.startsWith('uz') && entry.comments_uz) {
        return entry.comments_uz;
    }

    if (entry.comments) {
        return translateComment(
            entry.comments,
            normalizeActionType(entry.action_type),
            entry.metadata,
            language,
            t,
        );
    }

    const actionType = normalizeActionType(entry.action_type);
    return t(`timeline.comments.${actionType}`);
}

function translateComment(
    comments: string,
    actionType: string,
    metadata?: any,
    language?: string,
    t?: (key: string, params?: Record<string, any>) => string,
): string {
    const safeT = t || ((key: string) => key);
    if (actionType === 'status_change') {
        const statusMatch = comments.match(/status changed to\s+\"?([a-z_]+)\"?/i);
        if (statusMatch?.[1]) {
            return safeT('timeline.comments.status_change_to', {
                status: formatStatus(statusMatch[1], safeT),
            });
        }
        if (metadata?.old_value && metadata?.new_value) {
            return safeT('timeline.comments.status_change_from_to', {
                old: formatStatus(metadata.old_value, safeT),
                new: formatStatus(metadata.new_value, safeT),
            });
        }
        return safeT('timeline.comments.status_change');
    }
    if (actionType === 'price_set') {
        const matched = comments.match(/price set:\s*([\d.,]+)\s*uzs/i);
        if (matched?.[1]) {
            return safeT('timeline.comments.price_set_amount', { amount: `${matched[1]} UZS` });
        }
        return safeT('timeline.comments.price_set_range', {
            old: formatCurrency(metadata?.old_value || 0, language),
            new: formatCurrency(metadata?.new_value || 0, language),
        });
    }
    if (actionType === 'master_assigned') {
        return metadata?.master_name
            ? safeT('timeline.comments.master_assigned_named', { name: metadata.master_name })
            : safeT('timeline.comments.master_assigned');
    }
    if (actionType === 'price_approved') {
        return safeT('timeline.comments.price_approved');
    }
    if (actionType === 'price_rejected') {
        return safeT('timeline.comments.price_rejected', { reason: metadata?.reason || comments });
    }
    if (actionType === 'order_created') {
        return safeT('timeline.comments.order_created');
    }
    if (actionType === 'price_updated') {
        const matched = comments.match(/total price updated from\s*([\d.,]+)\s*to\s*([\d.,]+)/i);
        if (matched?.[1] && matched?.[2]) {
            return safeT('timeline.comments.price_updated_values', {
                old: `${matched[1]} UZS`,
                new: `${matched[2]} UZS`,
            });
        }
        return safeT('timeline.comments.price_updated_values', {
            old: formatCurrency(metadata?.old_value || 0, language),
            new: formatCurrency(metadata?.new_value || 0, language),
        });
    }
    if (actionType === 'item_completed') {
        return safeT('timeline.comments.item_completed');
    }

    return comments;
}

export default OrderTimeline;
