"use client";

import React, { createContext, useContext, useState } from 'react';
import ru from './ru.json';
import en from './en.json';
import uzCyr from './uz-cyr.json';
import uzLat from './uz-lat.json';

type TranslationData = Record<string, unknown>;

const translations: Record<string, TranslationData> = {
    'ru': ru as TranslationData,
    'en': en as TranslationData,
    'uz-cyr': uzCyr as TranslationData,
    'uz-lat': uzLat as TranslationData
};

type Language = 'ru' | 'en' | 'uz-cyr' | 'uz-lat';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: unknown, path: string): string | undefined {
    const keys = path.split('.');
    let result: unknown = obj;
    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = (result as Record<string, unknown>)[k];
        } else {
            return undefined;
        }
    }
    return typeof result === 'string' ? result : undefined;
}

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_language') as Language;
            if (saved && translations[saved]) {
                return saved;
            }
        }
        return 'ru';
    });

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('preferred_language', lang);
    };

    const t = (key: string, params?: Record<string, string>): string => {
        const value = getNestedValue(translations[language], key);
        let result = value ?? key;
        
        // Replace {{param}} with actual values
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                result = result.replace(`{{${paramKey}}}`, paramValue);
            });
        }
        
        return result;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useI18n must be used within I18nProvider');
    return context;
};
