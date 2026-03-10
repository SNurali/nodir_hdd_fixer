export type OrderStatus =
  | 'new'
  | 'assigned'
  | 'diagnosing'
  | 'awaiting_approval'
  | 'approved'
  | 'in_repair'
  | 'ready_for_pickup'
  | 'issued'
  | 'unrepairable'
  | 'cancelled';

export interface OrderDetail {
  id: string;
  equipment?: { name_rus?: string; name_eng?: string };
  issue?: { name_rus?: string; name_eng?: string };
  description_of_issue?: string;
  master?: { id?: string; full_name?: string };
  attached_to?: string | null;
  status: OrderStatus;
  price?: number | string;
  is_completed?: boolean | number;
  completed_at?: string;
}

export interface PaymentRecord {
  id: string;
  paid_amount?: number | string;
  amount_uzs?: number | string;
  payment_type?: string;
  method?: string;
  currency?: string;
  paid_at?: string;
  created_at?: string;
}

export interface AllowedTransition {
  to: OrderStatus;
  requirements?: string[];
}

export interface PriceHistoryRecord {
  id: string;
  old_price?: number | string;
  new_price?: number | string;
  changed_at?: string;
  reason?: string;
  user?: { full_name?: string };
}

export interface OrderMessage {
  id: string;
  sender_id?: string;
  text: string;
  created_at?: string;
  sender?: { full_name?: string };
}

export interface MasterOption {
  id: string;
  full_name?: string;
  phone?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  order_date: string;
  total_price_uzs?: number | string;
  total_paid_uzs?: number | string;
  deadline?: string;
  price_approved_at?: string | null;
  price_rejected_at?: string | null;
  details?: OrderDetail[];
  payments?: PaymentRecord[];
  client?: {
    full_name?: string;
    phone?: string;
    user_id?: string;
    email?: string;
    telegram?: string;
    preferred_language?: string;
  };
}

export type PaymentMethod = 'CASH' | 'UZCARD' | 'HUMO' | 'VISA' | 'CLICK' | 'PAYME' | 'PAYNET' | 'UZUM' | 'FREE';

export interface PaymentRow {
  amount: string;
  method: PaymentMethod;
}

export interface PriceUpdateForm {
  amount: string;
  reason: string;
}
