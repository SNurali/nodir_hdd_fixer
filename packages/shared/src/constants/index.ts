export const LANGUAGES = ['uz-cyr', 'uz-lat', 'ru', 'en'] as const;
export const DEFAULT_LANGUAGE = 'ru';

export const ORDER_STATUSES = [
    'new',
    'assigned',
    'diagnosing',
    'awaiting_approval',
    'approved',
    'in_repair',
    'ready_for_pickup',
    'unrepairable',
    'issued',
    'cancelled',
] as const;

export const PAYMENT_TYPES = [
    'UZCARD',
    'HUMO',
    'VISA',
    'CLICK',
    'PAYME',
    'CASH',
    'FREE',
    'PAYNET',
    'UZUM',
] as const;

export const CURRENCIES = ['UZS', 'USD', 'EUR'] as const;

export const NOTIFICATION_CHANNELS = ['email', 'sms', 'push'] as const;

export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
