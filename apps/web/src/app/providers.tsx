"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import { AuthProvider } from "./auth-provider";
import { AppSettingsProvider } from "./app-settings-provider";
import NavbarWrapper from "./navbar-wrapper";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppSettingsProvider>
            <div className="relative">
              <NavbarWrapper />
              <main className="pt-16">{children}</main>
            </div>
          </AppSettingsProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
