export enum OrderStatus {
    NEW = 'new',
    ASSIGNED = 'assigned',
    DIAGNOSING = 'diagnosing',
    AWAITING_APPROVAL = 'awaiting_approval',
    APPROVED = 'approved',
    IN_REPAIR = 'in_repair',
    READY_FOR_PICKUP = 'ready_for_pickup',
    UNREPAIRABLE = 'unrepairable',
    ISSUED = 'issued',
    CANCELLED = 'cancelled',
}

export enum CompletionStatus {
    IN_PROCESS = 0,
    SOLVED = 1,
    NOT_RESOLVED = 2,
}

export enum PaymentType {
    UZCARD = 'UZCARD',
    HUMO = 'HUMO',
    VISA = 'VISA',
    CLICK = 'CLICK',
    PAYME = 'PAYME',
    CASH = 'CASH',
    FREE = 'FREE',
    PAYNET = 'PAYNET',
    UZUM = 'UZUM',
}

export enum Currency {
    UZS = 'UZS',
    USD = 'USD',
    EUR = 'EUR',
}

export enum Language {
    UZ_CYR = 'uz-cyr',
    UZ_LAT = 'uz-lat',
    RU = 'ru',
    EN = 'en',
}

export enum UserRole {
    ADMIN = 'admin',
    OPERATOR = 'operator',
    MASTER = 'master',
    CLIENT = 'client',
}

export enum NotificationChannel {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
}

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
}
