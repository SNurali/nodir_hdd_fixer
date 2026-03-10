export interface Equipment {
  id: string;
  name_ru?: string;
  name_rus?: string;
  name_uz?: string;
  name_en?: string;
  name_eng?: string;
}

export interface Issue {
  id: string;
  name_ru?: string;
  name_rus?: string;
  name_en?: string;
  name_eng?: string;
}

export interface OrderItemDraft {
  equipment_id: string;
  issue_id: string;
  description: string;
}

export interface NewOrderFormData {
  equipment_id: string;
  issue_id: string;
  description: string;
  phone: string;
  full_name: string;
  telegram: string;
  preferred_language: string;
}

export type ContactUpdateDecision = 'pending' | 'update' | 'keep';

export interface ClientProfileSnapshot {
  full_name: string;
  phone: string;
  telegram: string;
  preferred_language: string;
}
