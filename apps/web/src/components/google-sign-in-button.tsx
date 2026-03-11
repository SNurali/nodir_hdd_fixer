"use client";

import React, { useEffect, useState } from "react";
import { Chrome } from "lucide-react";

interface GoogleSignInButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  theme?: "light" | "dark";
  hideIfNotConfigured?: boolean;
}

// Проверка доступности Google OAuth на бэкенде
async function checkGoogleOAuthConfig(): Promise<boolean> {
  try {
    const response = await fetch("/v1/auth/google/config");
    if (response.ok) {
      const data = await response.json();
      return data.enabled === true;
    }
    return false;
  } catch {
    return false;
  }
}

export function GoogleSignInButton({
  onClick,
  disabled = false,
  theme = "light",
  hideIfNotConfigured = true,
}: GoogleSignInButtonProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkGoogleOAuthConfig().then(setIsConfigured);
  }, []);

  // Если не настроено и нужно скрывать - не показываем
  if (hideIfNotConfigured && isConfigured === false) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isConfigured === false}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium
        transition-all duration-300 border-2
        ${
          isDark
            ? "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        }
        ${(disabled || isConfigured === false) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Google Icon */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span>
        {isConfigured === false ? "Google OAuth не настроен" : "Войти через Google"}
      </span>
    </button>
  );
}

// Alternative style with more prominent Google branding
export function GoogleSignInButtonProminent({
  onClick,
  disabled = false,
  theme = "light",
}: GoogleSignInButtonProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold
        transition-all duration-300
        ${
          isDark
            ? "bg-white text-slate-800 hover:bg-slate-100"
            : "bg-white text-slate-800 hover:bg-slate-50 border border-slate-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:shadow-slate-500/20 hover:scale-[1.02] active:scale-[0.98]"}
      `}
    >
      {/* Google Icon with background */}
      <div className="flex items-center justify-center w-6 h-6">
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </div>
      <span>Продолжить с Google</span>
    </button>
  );
}

// Divider component
export function AuthDivider({ text, theme = "light" }: { text: string; theme?: "light" | "dark" }) {
  const isDark = theme === "dark";

  return (
    <div className="relative flex items-center justify-center my-6">
      <div
        className={`absolute inset-0 flex items-center ${
          isDark ? "text-slate-700" : "text-slate-200"
        }`}
      >
        <div className="w-full border-t border-current" />
      </div>
      <span
        className={`relative px-4 text-sm font-medium ${
          isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-white"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
