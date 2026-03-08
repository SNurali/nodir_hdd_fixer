import { UserEntity } from '../../database/entities';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'telegram';
export type AppNotificationChannel = NotificationChannel | 'in_app';

type NotificationPreferences = {
    email: boolean;
    sms: boolean;
    push: boolean;
    telegram: boolean;
};

export const MARKETING_TEMPLATE_KEYS = new Set([
    'marketing_broadcast',
]);

export function getNotificationPreferences(user: Pick<UserEntity, 'account_settings'>): NotificationPreferences {
    const raw = user.account_settings && typeof user.account_settings === 'object'
        ? (user.account_settings as Record<string, unknown>)
        : {};
    const notifications = raw.notifications && typeof raw.notifications === 'object'
        ? (raw.notifications as Record<string, unknown>)
        : {};

    return {
        email: notifications.email !== false,
        sms: notifications.sms === true,
        push: notifications.push !== false,
        telegram: notifications.telegram !== false,
    };
}

export function isChannelEnabled(user: Pick<UserEntity, 'account_settings'>, channel: AppNotificationChannel): boolean {
    if (channel === 'in_app') {
        return true;
    }

    const prefs = getNotificationPreferences(user);
    return prefs[channel];
}

export function isMarketingTemplate(templateKey: string): boolean {
    return MARKETING_TEMPLATE_KEYS.has(templateKey);
}

export function isMarketingEnabled(user: Pick<UserEntity, 'account_settings'>): boolean {
    const raw = user.account_settings && typeof user.account_settings === 'object'
        ? (user.account_settings as Record<string, unknown>)
        : {};
    const rolePreferences = raw.role_preferences && typeof raw.role_preferences === 'object'
        ? (raw.role_preferences as Record<string, unknown>)
        : {};

    return rolePreferences.marketing_notifications === true;
}

export function isTemplateAllowed(
    user: Pick<UserEntity, 'account_settings'>,
    channel: AppNotificationChannel,
    templateKey: string,
): boolean {
    if (!isChannelEnabled(user, channel)) {
        return false;
    }

    if (isMarketingTemplate(templateKey) && !isMarketingEnabled(user)) {
        return false;
    }

    return true;
}
