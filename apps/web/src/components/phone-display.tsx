'use client';

import { Phone } from 'lucide-react';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import {
  getCountryFlagEmoji,
  getCountryDisplayName,
  formatPhoneForDisplay,
  getPreferredCountryFromPhone,
} from '@/lib/phone';
import { useI18n } from '@/i18n/provider';

interface PhoneDisplayProps {
  phone?: string | null;
  showIcon?: boolean;
  showCountry?: boolean;
  showFlag?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    wrapper: 'gap-2 p-2',
    icon: 'w-8 h-8',
    iconSize: 14,
    flag: 'text-base',
    country: 'text-xs',
    phone: 'text-sm',
  },
  md: {
    wrapper: 'gap-3 p-3',
    icon: 'w-10 h-10',
    iconSize: 18,
    flag: 'text-lg',
    country: 'text-xs',
    phone: 'text-base',
  },
  lg: {
    wrapper: 'gap-4 p-4',
    icon: 'w-12 h-12',
    iconSize: 22,
    flag: 'text-xl',
    country: 'text-sm',
    phone: 'text-lg',
  },
};

export function PhoneDisplay({
  phone,
  showIcon = true,
  showCountry = true,
  showFlag = true,
  size = 'md',
  className = '',
}: PhoneDisplayProps) {
  const { language } = useI18n();
  const appLanguage = (language || 'ru') as 'ru' | 'en' | 'uz-cyr' | 'uz-lat';

  if (!phone) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        {showIcon && (
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Phone size={18} className="text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-gray-400 italic text-sm">Не указан</p>
        </div>
      </div>
    );
  }

  const countryCode = getPreferredCountryFromPhone(phone, 'UZ');
  const flag = getCountryFlagEmoji(countryCode);
  const countryName = getCountryDisplayName(countryCode, appLanguage);
  const formattedPhone = formatPhoneForDisplay(phone, countryCode);

  // Parse to get national format if possible
  const parsed = parsePhoneNumberFromString(phone);
  const nationalNumber = parsed?.formatNational() || formattedPhone;
  const internationalNumber = parsed?.formatInternational() || phone;

  const sizes = sizeClasses[size];

  return (
    <a
      href={`tel:${phone}`}
      className={`
        group flex items-center ${sizes.wrapper} rounded-xl 
        bg-gradient-to-r from-green-50 to-emerald-50 
        dark:from-green-900/20 dark:to-emerald-900/20
        hover:from-green-100 hover:to-emerald-100
        dark:hover:from-green-900/30 dark:hover:to-emerald-900/30
        transition-all duration-200 hover:shadow-md
        border border-green-100 dark:border-green-800/30
        ${className}
      `}
    >
      {showIcon && (
        <div
          className={`
            ${sizes.icon} rounded-xl 
            bg-gradient-to-br from-green-500 to-emerald-600 
            flex items-center justify-center shadow-sm
            group-hover:scale-105 transition-transform duration-200
          `}
        >
          <Phone size={sizes.iconSize} className="text-white" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {showFlag && <span className={`${sizes.flag} leading-none`}>{flag}</span>}
          {showCountry && (
            <span
              className={`
                ${sizes.country} font-medium text-green-700 dark:text-green-400
                uppercase tracking-wider
              `}
            >
              {countryName}
            </span>
          )}
        </div>
        <p
          className={`
            ${sizes.phone} font-bold text-gray-900 dark:text-gray-100
            group-hover:text-green-700 dark:group-hover:text-green-400
            transition-colors duration-200
            tracking-wide
          `}
        >
          {internationalNumber}
        </p>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Phone size={14} className="text-green-600 dark:text-green-400" />
        </div>
      </div>
    </a>
  );
}

// Compact version for inline display
interface PhoneBadgeProps {
  phone?: string | null;
  className?: string;
}

export function PhoneBadge({ phone, className = '' }: PhoneBadgeProps) {
  const { language } = useI18n();
  const appLanguage = (language || 'ru') as 'ru' | 'en' | 'uz-cyr' | 'uz-lat';

  if (!phone) return null;

  const countryCode = getPreferredCountryFromPhone(phone, 'UZ');
  const flag = getCountryFlagEmoji(countryCode);
  const countryName = getCountryDisplayName(countryCode, appLanguage);
  const parsed = parsePhoneNumberFromString(phone);
  const formattedPhone = parsed?.formatInternational() || phone;

  return (
    <a
      href={`tel:${phone}`}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-gradient-to-r from-green-500 to-emerald-600
        text-white text-sm font-medium
        hover:from-green-600 hover:to-emerald-700
        transition-all duration-200 hover:shadow-md
        ${className}
      `}
    >
      <span className="text-base leading-none">{flag}</span>
      <span className="hidden sm:inline text-xs opacity-90">{countryName}</span>
      <span className="font-semibold tracking-wide">{formattedPhone}</span>
    </a>
  );
}
