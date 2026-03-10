"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from './auth-provider';
import { useI18n } from '@/i18n/provider';
import { DEFAULT_UI_SETTINGS, formatAppDate, formatAppDateTime, formatAppTime, type UiSettings } from '@/lib/ui-settings';

type AccountSettingsResponse = {
  settings?: {
    ui?: Partial<UiSettings>;
  };
};

interface AppSettingsContextType {
  ui: UiSettings;
  setUiSettings: (patch: Partial<UiSettings>) => void;
  formatDate: (value: string | Date | null | undefined) => string;
  formatDateTime: (value: string | Date | null | undefined) => string;
  formatTime: (value: string | Date | null | undefined) => string;
}

const STORAGE_KEY = 'app_ui_settings';
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);
const FALLBACK_CONTEXT: AppSettingsContextType = {
  ui: DEFAULT_UI_SETTINGS,
  setUiSettings: () => {},
  formatDate: (value) => formatAppDate(value, DEFAULT_UI_SETTINGS, 'ru-RU'),
  formatDateTime: (value) => formatAppDateTime(value, DEFAULT_UI_SETTINGS, 'ru-RU'),
  formatTime: (value) => formatAppTime(value, DEFAULT_UI_SETTINGS, 'ru-RU'),
};

function localeFromLanguage(language: string): string {
  if (language === 'en') return 'en-US';
  if (language === 'uz-lat') return 'uz-UZ';
  if (language === 'uz-cyr') return 'uz-Cyrl-UZ';
  return 'ru-RU';
}

function readStoredUiSettings(): UiSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_SETTINGS;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_UI_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    return { ...DEFAULT_UI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { language } = useI18n();
  const [ui, setUi] = useState<UiSettings>(() => readStoredUiSettings());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
    document.body.classList.toggle('compact-mode', ui.compact_mode);
    document.body.dataset.timezone = ui.timezone;
    document.body.dataset.dateFormat = ui.date_format;
  }, [ui]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!user) {
        if (isMounted) {
          setUi(readStoredUiSettings());
        }
        return;
      }

      try {
        const response = await api.get<AccountSettingsResponse>('/users/me/settings');
        const payload = response.data?.settings?.ui || {};
        if (!isMounted) return;
        setUi((prev) => ({
          ...prev,
          ...payload,
        }));
      } catch {
        if (!isMounted) return;
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const value = useMemo<AppSettingsContextType>(() => ({
    ui,
    setUiSettings: (patch) => {
      setUi((prev) => ({ ...prev, ...patch }));
    },
    formatDate: (value) => formatAppDate(value, ui, localeFromLanguage(language)),
    formatDateTime: (value) => formatAppDateTime(value, ui, localeFromLanguage(language)),
    formatTime: (value) => formatAppTime(value, ui, localeFromLanguage(language)),
  }), [ui, language]);

  return (
    <AppSettingsContext.Provider value={value}>
      <div className={ui.compact_mode ? 'app-shell compact-shell' : 'app-shell'}>{children}</div>
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext) || FALLBACK_CONTEXT;
}
