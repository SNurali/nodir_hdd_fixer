/**
 * Order State Machine
 * 
 * Определяет разрешённые переходы статусов заказа
 * и бизнес-правила для каждого перехода
 */

export type OrderStatus =
    | 'new'
    | 'assigned'
    | 'diagnosing'
    | 'awaiting_approval'
    | 'approved'
    | 'in_repair'
    | 'ready_for_pickup'
    | 'unrepairable'
    | 'issued'
    | 'cancelled';

export type OrderRole = 'admin' | 'operator' | 'master' | 'client';

export interface StateTransition {
    from: OrderStatus;
    to: OrderStatus;
    allowedRoles: OrderRole[];
    description: string;
    requirements?: string[];
}

/**
 * Карта разрешённых переходов
 */
export const STATE_TRANSITIONS: StateTransition[] = [
    // ===== 1. СОЗДАН =====
    {
        from: 'new',
        to: 'assigned',
        allowedRoles: ['admin', 'operator'],
        description: 'Назначить мастера и взять заказ в работу',
        requirements: ['Мастер назначен'],
    },
    {
        from: 'new',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator', 'client'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 2. НАЗНАЧЕН =====
    {
        from: 'assigned',
        to: 'diagnosing',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Начать диагностику',
        requirements: [],
    },
    {
        from: 'assigned',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator', 'client'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 3. ДИАГНОСТИКА =====
    {
        from: 'diagnosing',
        to: 'awaiting_approval',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Выставить цену клиенту на подтверждение',
        requirements: ['Цена установлена'],
    },
    {
        from: 'diagnosing',
        to: 'unrepairable',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Признать неремонтопригодным',
        requirements: [],
    },
    {
        from: 'diagnosing',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 4. ОЖИДАЕТ ОДОБРЕНИЯ КЛИЕНТА =====
    {
        from: 'awaiting_approval',
        to: 'approved',
        allowedRoles: ['client'],
        description: 'Клиент подтвердил готовность оплатить',
        requirements: ['Цена установлена'],
    },
    {
        from: 'awaiting_approval',
        to: 'diagnosing',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Вернуться к диагностике/перерасчёту',
        requirements: [],
    },
    {
        from: 'awaiting_approval',
        to: 'cancelled',
        allowedRoles: ['client', 'admin', 'operator'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 5. ОДОБРЕН =====
    {
        from: 'approved',
        to: 'in_repair',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Начать ремонт',
        requirements: ['Мастер назначен', 'Цена одобрена'],
    },
    {
        from: 'approved',
        to: 'diagnosing',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Вернуться к диагностике',
        requirements: [],
    },
    {
        from: 'approved',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 6. РЕМОНТ =====
    {
        from: 'in_repair',
        to: 'ready_for_pickup',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Работы завершены, заказ готов к выдаче',
        requirements: ['Работы выполнены'],
    },
    {
        from: 'in_repair',
        to: 'diagnosing',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Вернуться к диагностике',
        requirements: [],
    },
    {
        from: 'in_repair',
        to: 'unrepairable',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Признать неремонтопригодным',
        requirements: [],
    },
    {
        from: 'in_repair',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator'],
        description: 'Отменить заказ',
        requirements: [],
    },

    // ===== 7. ГОТОВ К ВЫДАЧЕ =====
    {
        from: 'ready_for_pickup',
        to: 'issued',
        allowedRoles: ['admin', 'operator'],
        description: 'Выдать заказ клиенту и закрыть',
        requirements: ['Оплата подтверждена'],
    },
    {
        from: 'ready_for_pickup',
        to: 'in_repair',
        allowedRoles: ['admin', 'operator', 'master'],
        description: 'Вернуть в ремонт',
        requirements: [],
    },

    // ===== НЕРЕМОНТОПРИГОДЕН =====
    {
        from: 'unrepairable',
        to: 'issued',
        allowedRoles: ['admin', 'operator'],
        description: 'Выдать клиенту без ремонта',
        requirements: [],
    },
    {
        from: 'unrepairable',
        to: 'cancelled',
        allowedRoles: ['admin', 'operator'],
        description: 'Отменить заказ',
        requirements: [],
    },
];

/**
 * Проверка разрешённого перехода
 */
export function canTransition(
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    userRole: OrderRole
): { allowed: boolean; reason?: string } {
    // Один и тот же статус - всегда ок (no-op)
    if (fromStatus === toStatus) {
        return { allowed: true };
    }
    const transition = STATE_TRANSITIONS.find(
        t => t.from === fromStatus && t.to === toStatus
    );

    if (!transition) {
        return {
            allowed: false,
            reason: `Переход из "${fromStatus}" в "${toStatus}" запрещён`
        };
    }

    if (!transition.allowedRoles.includes(userRole)) {
        return {
            allowed: false,
            reason: `Роль "${userRole}" не может выполнить этот переход. Требуется: ${transition.allowedRoles.join(', ')}`
        };
    }

    return { allowed: true };
}

/**
 * Получить доступные переходы для статуса и роли
 */
export function getAvailableTransitions(
    currentStatus: OrderStatus,
    userRole: OrderRole
): StateTransition[] {
    return STATE_TRANSITIONS.filter(
        t => t.from === currentStatus && t.allowedRoles.includes(userRole)
    );
}

/**
 * Валидация требований перехода
 */
export function validateTransitionRequirements(
    transition: StateTransition,
    orderData: any
): { valid: boolean; missingRequirements?: string[] } {
    if (!transition.requirements || transition.requirements.length === 0) {
        return { valid: true };
    }

    const missing: string[] = [];

    for (const req of transition.requirements) {
        if (req.includes('Мастер назначен') && !orderData.has_assigned_master) {
            missing.push('Мастер должен быть назначен');
        }
        if (req.includes('Цена одобрена') && !orderData.price_approved_at) {
            missing.push('Цена должна быть согласована с клиентом');
        }
        if (req.includes('Цена установлена') && (!orderData.total_price_uzs || Number(orderData.total_price_uzs) <= 0)) {
            missing.push('Цена должна быть установлена');
        }
        if (req.includes('Работы выполнены') && !orderData.all_details_completed) {
            missing.push('Все работы по заказу должны быть отмечены как выполненные');
        }
        if (req.includes('Оплата подтверждена')) {
            const totalPrice = Number(orderData.total_price_uzs || 0);
            const totalPaid = Number(orderData.total_paid_uzs || 0);
            // Free repairs (price = 0) are always considered paid
            if (totalPrice > 0 && totalPaid < totalPrice) {
                missing.push('Оплата должна быть подтверждена');
            }
        }
    }

    return {
        valid: missing.length === 0,
        missingRequirements: missing
    };
}

/**
 * Получить описание статуса
 */
export function getStatusDescription(status: OrderStatus): string {
    const descriptions: Record<OrderStatus, string> = {
        new: 'Новый заказ, ожидает принятия',
        assigned: 'Мастер назначен, ожидает начала диагностики',
        diagnosing: 'Диагностика устройства',
        awaiting_approval: 'Цена выставлена, ожидается одобрение клиента',
        approved: 'Цена одобрена клиентом, готов к ремонту',
        in_repair: 'Мастер выполняет ремонт',
        ready_for_pickup: 'Ремонт завершён, готов к выдаче',
        unrepairable: 'Ремонт невозможен',
        issued: 'Выдан клиенту',
        cancelled: 'Заказ отменён',
    };
    return descriptions[status];
}

/**
 * Получить цвет статуса для UI
 */
export function getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
        new: 'purple',
        assigned: 'blue',
        diagnosing: 'cyan',
        awaiting_approval: 'orange',
        approved: 'green',
        in_repair: 'yellow',
        ready_for_pickup: 'emerald',
        unrepairable: 'red',
        issued: 'teal',
        cancelled: 'gray',
    };
    return colors[status];
}
