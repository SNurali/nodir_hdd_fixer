import { Phone, Send } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type {
  ClientProfileSnapshot,
  ContactUpdateDecision,
  NewOrderFormData,
} from '../types';

interface NewOrderStepContactProps {
  formData: NewOrderFormData;
  phoneError: string;
  isClientRole: boolean;
  hasContactDiff: boolean;
  profileSnapshot: ClientProfileSnapshot | null;
  contactUpdateDecision: ContactUpdateDecision;
  title: string;
  subtitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  phoneLabel: string;
  languageLabel: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onTelegramChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onUpdateDecisionChange: (decision: ContactUpdateDecision) => void;
  onKeepProfileContacts: () => void;
}

export function NewOrderStepContact({
  formData,
  phoneError,
  isClientRole,
  hasContactDiff,
  profileSnapshot,
  contactUpdateDecision,
  title,
  subtitle,
  fullNameLabel,
  fullNamePlaceholder,
  phoneLabel,
  languageLabel,
  onFullNameChange,
  onPhoneChange,
  onTelegramChange,
  onLanguageChange,
  onUpdateDecisionChange,
  onKeepProfileContacts,
}: NewOrderStepContactProps) {
  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^+\d]/g, '');
    onPhoneChange(value);
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>

      <div className="space-y-5">
        <div>
          <label className="input-label">{fullNameLabel}</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder={fullNamePlaceholder}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">{phoneLabel}</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="+998901234567"
              className={`input-field pl-12 ${
                phoneError
                  ? 'border-red-500 focus:border-red-500'
                  : formData.phone && !phoneError
                    ? 'border-green-500 focus:border-green-500'
                    : ''
              }`}
            />
          </div>
          {phoneError ? (
            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">⚠️ {phoneError}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1 ml-1">📱 Формат: +998901234567 (9 цифр после +998)</p>
          )}
        </div>

        <div>
          <label className="input-label flex items-center gap-2">Telegram (необязательно)</label>
          <div className="relative">
            <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={formData.telegram}
              onChange={(event) => onTelegramChange(event.target.value)}
              placeholder="@username"
              className="input-field pl-12"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">💡 Укажите Telegram для быстрой связи</p>
        </div>

        <div>
          <label className="input-label">{languageLabel}</label>
          <select
            value={formData.preferred_language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="input-field"
          >
            <option value="ru">Русский</option>
            <option value="uz-lat">O&apos;zbekcha</option>
            <option value="uz-cyr">Узбекча</option>
            <option value="en">English</option>
          </select>
        </div>

        {isClientRole && profileSnapshot && hasContactDiff && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">Вы изменили контактные данные профиля</p>
            <p className="text-xs text-amber-700 mb-3">Обновить профиль этими данными?</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateDecisionChange('update')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  contactUpdateDecision === 'update'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                Да, обновить профиль
              </button>
              <button
                type="button"
                onClick={onKeepProfileContacts}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  contactUpdateDecision === 'keep'
                    ? 'bg-gray-700 text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Нет, оставить данные профиля
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
