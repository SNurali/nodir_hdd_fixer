import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'UZ';
export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

const PINNED_COUNTRIES: CountryCode[] = ['UZ', 'RU', 'US', 'KZ', 'KG', 'TJ', 'TR', 'AE'];

export type AppLanguage = 'ru' | 'en' | 'uz-cyr' | 'uz-lat';

export function mapAppLanguageToLocale(language: AppLanguage = 'ru'): string {
  if (language === 'uz-cyr') return 'uz-Cyrl';
  if (language === 'uz-lat') return 'uz-Latn';
  return language;
}

export function getCountryFlagEmoji(country: CountryCode): string {
  return country
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
}

export function getCountryDisplayName(country: CountryCode, language: AppLanguage = 'ru'): string {
  const locale = mapAppLanguageToLocale(language);

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(country) || country;
  } catch {
    return country;
  }
}

export function getPreferredCountryFromPhone(
  value: string,
  fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): CountryCode {
  const parsed = parsePhoneNumberFromString(value || '');
  return (parsed?.country as CountryCode | undefined) || fallbackCountry;
}

export function getPhoneNationalValue(
  value: string,
  fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): string {
  const rawValue = (value || '').trim();
  if (!rawValue) return '';

  const formatter = new AsYouType();
  formatter.input(rawValue);
  const nationalNumber = formatter.getNationalNumber();

  if (nationalNumber) {
    return nationalNumber;
  }

  const digits = rawValue.replace(/\D/g, '');
  const callingCode = getCountryCallingCode(fallbackCountry);

  return digits.startsWith(callingCode) ? digits.slice(callingCode.length) : digits;
}

export function formatPhoneForDisplay(
  value: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY,
): string {
  const nationalValue = getPhoneNationalValue(value, country);
  if (!nationalValue) return '';

  return new AsYouType(country).input(nationalValue);
}

export function buildE164Phone(
  value: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY,
): string {
  const formatter = new AsYouType(country);
  formatter.input(value);
  return formatter.getNumberValue() || '';
}

export function remapPhoneCountry(
  value: string,
  nextCountry: CountryCode,
  fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): string {
  const nationalValue = getPhoneNationalValue(value, fallbackCountry);
  if (!nationalValue) return '';

  const formatter = new AsYouType(nextCountry);
  formatter.input(nationalValue);

  return formatter.getNumberValue() || `+${getCountryCallingCode(nextCountry)}${nationalValue.replace(/\D/g, '')}`;
}

export function normalizePhone(value: string, fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  const rawValue = (value || '').trim();
  if (!rawValue) return '';

  if (rawValue.startsWith('+')) {
    return rawValue.replace(/[^\d+]/g, '');
  }

  return buildE164Phone(rawValue, fallbackCountry) || rawValue;
}

export function getPhonePlaceholder(country: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  return getExampleNumber(country, examples)?.formatNational() || '90 123 45 67';
}

export function getCountryOptions(language: AppLanguage = 'ru', allowedCountries?: CountryCode[]) {
  const countrySet = allowedCountries && allowedCountries.length > 0 ? allowedCountries : getCountries();

  return [...countrySet]
    .map((country) => ({
      country,
      name: getCountryDisplayName(country, language),
      callingCode: getCountryCallingCode(country),
      flag: getCountryFlagEmoji(country),
      pinned: PINNED_COUNTRIES.includes(country),
    }))
    .sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return left.pinned ? -1 : 1;
      }

      return left.name.localeCompare(right.name, mapAppLanguageToLocale(language));
    });
}
