"use client";

import React, { useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import {
  DEFAULT_PHONE_COUNTRY,
  buildE164Phone,
  formatPhoneForDisplay,
  getCountryOptions,
  getPhonePlaceholder,
  getPreferredCountryFromPhone,
  remapPhoneCountry,
  type AppLanguage,
} from '@/lib/phone';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  defaultCountry?: CountryCode;
  allowedCountries?: CountryCode[];
  autoComplete?: string;
  inputClassName?: string;
  buttonClassName?: string;
  wrapperClassName?: string;
  dropdownClassName?: string;
  searchClassName?: string;
  showCountryName?: boolean;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function PhoneInput({
  value,
  onChange,
  name,
  id,
  disabled = false,
  required = false,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  allowedCountries,
  autoComplete = 'tel',
  inputClassName,
  buttonClassName,
  wrapperClassName,
  dropdownClassName,
  searchClassName,
  showCountryName = true,
}: PhoneInputProps) {
  const { language } = useI18n();
  const phoneLanguage = (language || 'ru') as AppLanguage;
  const generatedId = useId();
  const fieldId = id || generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => getPreferredCountryFromPhone(value, defaultCountry));

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const countries = getCountryOptions(phoneLanguage, allowedCountries);
  const currentCountry = getPreferredCountryFromPhone(value, selectedCountry);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredCountries = normalizedSearch
    ? countries.filter((country) => {
        const searchTarget = `${country.name} ${country.country} +${country.callingCode}`.toLowerCase();
        return searchTarget.includes(normalizedSearch);
      })
    : countries;

  const activeCountry = countries.find((country) => country.country === currentCountry) || countries[0];
  const displayValue = formatPhoneForDisplay(value, currentCountry);
  const placeholder = getPhonePlaceholder(currentCountry);

  const searchPlaceholder = phoneLanguage === 'en'
    ? 'Search country'
    : phoneLanguage === 'uz-lat'
      ? 'Mamlakatni qidiring'
      : phoneLanguage === 'uz-cyr'
        ? 'Мамлакатни қидиринг'
        : 'Поиск страны';

  const emptyText = phoneLanguage === 'en'
    ? 'Nothing found'
    : phoneLanguage === 'uz-lat'
      ? 'Hech narsa topilmadi'
      : phoneLanguage === 'uz-cyr'
        ? 'Ҳеч нарса топилмади'
        : 'Ничего не найдено';

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = buildE164Phone(event.target.value, currentCountry);
    onChange(nextValue);
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');

    const remappedValue = remapPhoneCountry(value, country, currentCountry);
    onChange(remappedValue);
  };

  const clearPhone = () => {
    onChange('');
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cx(
          'group flex items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-sky-500/60 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900/80',
          wrapperClassName,
        )}
      >
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className={cx(
            'flex min-w-[122px] items-center gap-2 border-r border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800/80',
            buttonClassName,
          )}
        >
          <span className="text-lg leading-none">{activeCountry?.flag || '🌍'}</span>
          <span className="min-w-0 flex-1">
            {showCountryName && activeCountry ? (
              <span className="block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeCountry.name}
              </span>
            ) : null}
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              +{activeCountry?.callingCode || ''}
            </span>
          </span>
          <ChevronDown className={cx('h-4 w-4 text-slate-400 transition', isOpen && 'rotate-180')} />
        </button>

        <div className="relative min-w-0 flex-1">
          <input
            id={fieldId}
            name={name}
            type="tel"
            inputMode="tel"
            value={displayValue}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className={cx(
              'h-full w-full bg-transparent px-4 py-3 pr-11 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500',
              inputClassName,
            )}
          />

          {displayValue ? (
            <button
              type="button"
              onClick={clearPhone}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Clear phone"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div
          className={cx(
            'absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900',
            dropdownClassName,
          )}
        >
          <div className="border-b border-slate-200 p-3 dark:border-slate-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className={cx(
                  'w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
                  searchClassName,
                )}
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.country}
                  type="button"
                  onClick={() => handleCountrySelect(country.country)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sky-50 dark:hover:bg-slate-800',
                    country.country === currentCountry && 'bg-sky-50 dark:bg-slate-800/80',
                  )}
                >
                  <span className="text-xl leading-none">{country.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {country.name}
                    </span>
                    <span className="block text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {country.country} • +{country.callingCode}
                    </span>
                  </span>
                  {country.country === currentCountry ? <Check className="h-4 w-4 text-sky-500" /> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
