import { z } from 'zod';
import { LANGUAGES, PAYMENT_TYPES, CURRENCIES } from '../constants/index';

// ===== Auth =====
export const RegisterDto = z.object({
    full_name: z.string().min(2).max(255),
    phone: z.string().regex(/^\+998\d{9}$/, 'Phone must be +998XXXXXXXXX'),
    email: z.string().email().optional(),
    telegram: z.string().max(100).optional(),
    password: z.string().min(6).max(100),
    preferred_language: z.enum(LANGUAGES).default('ru'),
});

export const LoginDto = z.object({
    login: z.string().min(1), // phone or email
    password: z.string().min(1),
});

export const ForgotPasswordDto = z.object({
    login: z.string().min(1), // phone or email
});

export const ResetPasswordDto = z.object({
    token: z.string().min(8),
    new_password: z.string().min(6).max(100),
});

// ===== Client =====
export const CreateClientDto = z.object({
    full_name: z.string().min(2).max(255),
    phone: z.string().regex(/^\+998\d{9}$/),
    telegram: z.string().max(100).optional(),
    email: z.string().email().optional(),
    preferred_language: z.enum(LANGUAGES).default('ru'),
});

export const UpdateClientDto = CreateClientDto.partial();

// ===== Multilingual Name =====
const MultilingualName = z.object({
    name_rus: z.string().min(1).max(255),
    name_cyr: z.string().min(1).max(255),
    name_lat: z.string().min(1).max(255),
    name_eng: z.string().min(1).max(255),
});

export const CreateEquipmentDto = MultilingualName;
export const UpdateEquipmentDto = MultilingualName.partial();
export const CreateServiceDto = MultilingualName;
export const UpdateServiceDto = MultilingualName.partial();
export const CreateIssueDto = MultilingualName;
export const UpdateIssueDto = MultilingualName.partial();
export const CreateRoleDto = MultilingualName;
export const UpdateRoleDto = MultilingualName.partial();

// ===== Order Detail =====
export const CreateOrderDetailDto = z.object({
    service_id: z.string().uuid(),
    equipment_id: z.string().uuid(),
    issue_id: z.string().uuid(),
    description_of_issue: z.string().optional(),
    price: z.number().min(0).default(0),
    attached_to: z.string().uuid().nullable().optional(),
});

// ===== Order =====
export const CreateOrderDto = z.object({
    client_id: z.string().uuid().optional(), // auto for client role
    language: z.enum(LANGUAGES).optional(),
    deadline: z.string().datetime().optional(),
    details: z.array(CreateOrderDetailDto).min(1),
    // Guest checkout fields
    guest_name: z.string().min(2).max(255).optional(),
    guest_phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
    guest_telegram: z.string().max(100).optional(),
    guest_email: z.string().email().optional(),
});

export const UpdateOrderDto = z.object({
    status: z
        .enum([
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
        ])
        .optional(),
    deadline: z.string().datetime().optional(),
    reason: z.string().optional(),
});

export const SetPriceDto = z.object({
    details: z.array(
        z.object({
            detail_id: z.string().uuid(),
            price: z.number().min(0),
        }),
    ),
});

export const UpdateTotalPriceDto = z.object({
    new_price: z.number().min(0),
    reason: z.string().min(1).optional(),
});

// ===== Payment =====
export const CreatePaymentItemDto = z.object({
    payment_type: z.enum(PAYMENT_TYPES),
    paid_amount: z.number().positive(),
    currency: z.enum(CURRENCIES).default('UZS'),
});

export const CreatePaymentDto = z.object({
    payment_type: z.enum(PAYMENT_TYPES).optional(),
    paid_amount: z.number().positive().optional(),
    currency: z.enum(CURRENCIES).default('UZS'),
    // Support for split payments
    split_payments: z.array(CreatePaymentItemDto).optional(),
});

// ===== Lifecycle =====
export const CreateLifecycleDto = z.object({
    order_details_id: z.string().uuid().optional(),
    comments: z.string().min(1),
    is_completed: z.number().int().min(0).max(2).default(0),
});

// ===== Assign Master =====
export const AssignMasterDto = z.object({
    master_id: z.string().uuid(),
});

// ===== Complete Detail =====
export const CompleteDetailDto = z.object({
    is_completed: z.number().int().min(1).max(2),
    comments: z.string().optional(),
});

// ===== User =====
export const CreateUserDto = z.object({
    full_name: z.string().min(2).max(255),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+998\d{9}$/).optional(),
    telegram: z.string().max(100).optional(),
    password: z.string().min(6).max(100),
    role_id: z.string().uuid(),
    preferred_language: z.enum(LANGUAGES).default('ru'),
});

export const UpdateUserDto = z.object({
    full_name: z.string().min(2).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+998\d{9}$/).optional(),
    telegram: z.string().max(100).optional(),
    preferred_language: z.enum(LANGUAGES).optional(),
});

export const ChangeUserRoleDto = z.object({
    role_id: z.string().uuid(),
});

// ===== Pagination =====
export const PaginationDto = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
});

// Export types
export type TRegisterDto = z.infer<typeof RegisterDto>;
export type TLoginDto = z.infer<typeof LoginDto>;
export type TForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;
export type TResetPasswordDto = z.infer<typeof ResetPasswordDto>;
export type TCreateClientDto = z.infer<typeof CreateClientDto>;
export type TUpdateClientDto = z.infer<typeof UpdateClientDto>;
export type TCreateOrderDto = z.infer<typeof CreateOrderDto>;
export type TUpdateOrderDto = z.infer<typeof UpdateOrderDto>;
export type TCreateOrderDetailDto = z.infer<typeof CreateOrderDetailDto>;
export type TSetPriceDto = z.infer<typeof SetPriceDto>;
export type TUpdateTotalPriceDto = z.infer<typeof UpdateTotalPriceDto>;
export type TCreatePaymentDto = z.infer<typeof CreatePaymentDto>;
export type TCreateLifecycleDto = z.infer<typeof CreateLifecycleDto>;
export type TAssignMasterDto = z.infer<typeof AssignMasterDto>;
export type TCompleteDetailDto = z.infer<typeof CompleteDetailDto>;
export type TCreateUserDto = z.infer<typeof CreateUserDto>;
export type TUpdateUserDto = z.infer<typeof UpdateUserDto>;
export type TPaginationDto = z.infer<typeof PaginationDto>;
export type TChangeUserRoleDto = z.infer<typeof ChangeUserRoleDto>;
