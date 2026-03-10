/**
 * Auto-generated API Types
 * 
 * These types are manually curated based on the API schema.
 * Run 'npm run generate:api' to regenerate from OpenAPI spec.
 */

import type { OrderStatus, PaymentType, Currency, Language, UserRole } from '@hdd-fixer/shared';

// ===== Common Types =====

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  success: boolean;
  message?: string;
}

// ===== Auth =====

export interface RegisterRequest {
  full_name: string;
  phone: string;
  email?: string;
  telegram?: string;
  password: string;
  preferred_language: Language;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    role_name: string;
  };
}

export interface ForgotPasswordRequest {
  login: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ===== Client =====

export interface ClientEntity {
  id: string;
  full_name: string;
  phone: string;
  telegram?: string;
  email?: string;
  preferred_language: Language;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  full_name: string;
  phone: string;
  telegram?: string;
  email?: string;
  preferred_language: Language;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

// ===== Order =====

export interface OrderDetailRequest {
  service_id: string;
  equipment_id: string;
  issue_id: string;
  description_of_issue?: string;
  price?: number;
  attached_to?: string | null;
}

export interface OrderDetail extends OrderDetailRequest {
  id: string;
  order_id: string;
  is_completed: number;
  completed_at?: string;
  completed_comments?: string;
  master?: {
    id: string;
    full_name: string;
    phone?: string;
  } | null;
  service?: { name_rus: string; name_eng: string };
  equipment?: { name_rus: string; name_eng: string };
  issue?: { name_rus: string; name_eng: string };
}

export interface CreateOrderRequest {
  client_id?: string;
  language?: Language;
  deadline?: string;
  details: OrderDetailRequest[];
  guest_name?: string;
  guest_phone?: string;
  guest_telegram?: string;
  guest_email?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  deadline?: string;
  reason?: string;
}

export interface OrderEntity {
  id: string;
  order_date: string;
  order_time: string;
  status: OrderStatus;
  deadline?: string;
  language: Language;
  client_id: string;
  total_qty: number;
  total_price_uzs: number;
  total_paid_uzs: number;
  total_paid_usd: number;
  total_paid_eur: number;
  currency_rate_usd: number;
  currency_rate_eur: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  price_approved_at?: string;
  price_approved_by?: string;
  price_rejected_at?: string;
  price_rejected_by?: string;
  price_rejection_reason?: string;
  diagnostics_report?: string;
  estimated_price?: number;
  estimated_days?: number;
  public_tracking_token?: string;
  client?: ClientEntity;
  details?: OrderDetail[];
  payments?: PaymentEntity[];
  lifecycle?: OrderLifecycleEntity[];
}

export interface SetPriceRequest {
  details: {
    detail_id: string;
    price: number;
  }[];
}

export interface AssignMasterRequest {
  master_id: string;
  detail_id?: string;
}

export interface RejectPriceRequest {
  reason: string;
}

// ===== Payment =====

export interface PaymentEntity {
  id: string;
  order_id: string;
  payment_type: PaymentType;
  paid_amount: number;
  currency: Currency;
  paid_at: string;
  cashier_by?: string;
  cashier?: {
    id: string;
    full_name: string;
  };
  external_txn_id?: string;
  provider?: string;
}

export interface CreatePaymentRequest {
  payment_type?: PaymentType;
  paid_amount?: number;
  currency?: Currency;
  split_payments?: {
    payment_type: PaymentType;
    paid_amount: number;
    currency: Currency;
  }[];
}

export interface UpdatePaymentRequest {
  payment_type?: PaymentType;
  paid_amount: number;
  currency?: Currency;
}

export interface RefundRequest {
  reason: string;
}

// ===== User =====

export interface UserEntity {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  telegram?: string;
  role_id: string;
  role?: {
    id: string;
    name_eng: string;
    name_ru: string;
  };
  role_name: string;
  preferred_language: Language;
  created_at: string;
  account_settings?: {
    role_preferences?: {
      require_status_comment?: boolean;
    };
  };
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  preferred_language?: Language;
}

// ===== Equipment/Service/Issue =====

export interface MultilingualName {
  name_rus: string;
  name_cyr: string;
  name_lat: string;
  name_eng: string;
}

export interface EquipmentEntity extends MultilingualName {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceEntity extends MultilingualName {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface IssueEntity extends MultilingualName {
  id: string;
  created_at: string;
  updated_at: string;
}

// ===== Lifecycle =====

export interface OrderLifecycleEntity {
  id: string;
  order_id: string;
  order_details_id?: string;
  comments?: string;
  comments_en?: string;
  comments_uz?: string;
  is_completed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  action_type?: string;
  metadata?: any;
  actor_id?: string;
  actor_role?: string;
  from_status?: string;
  to_status?: string;
  reason?: string;
  creator?: UserEntity;
}

// ===== Price History =====

export interface PriceHistoryEntity {
  id: string;
  order_id: string;
  order_detail_id?: string;
  old_price: number;
  new_price: number;
  reason?: string;
  changed_by: string;
  changed_at: string;
  user?: UserEntity;
}

// ===== Stats & Reports =====

export interface OrderStats {
  totalOrders: number;
  activeRepairs: number;
  completedToday: number;
  totalRevenue: number;
  ordersTrendPercent: number;
  period: string;
}

export interface FinancialReport {
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
  total_overdue: number;
  by_currency: {
    currency: string;
    amount: number;
    percentage: number;
  }[];
  by_payment_type: {
    type: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  daily_revenue: {
    date: string;
    amount: number;
    count: number;
  }[];
  unpaid_orders: {
    id: string;
    client_name: string;
    total_amount: number;
    paid_amount: number;
    unpaid_amount: number;
    created_at: string;
    deadline?: string;
    status: OrderStatus;
  }[];
}

export interface SlaReport {
  average_time_in_status: Record<string, number>;
  total_orders: number;
  completed_orders: number;
  overdue_orders: number;
  on_time_percentage: number;
  by_status: {
    status: string;
    count: number;
    average_duration_ms: number;
    average_duration_formatted: string;
  }[];
}

// ===== API Client Types =====

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
