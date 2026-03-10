"use client";

import Navbar from '@/components/navbar';
import { useTheme } from '@/components/theme-provider';

export default function NavbarWrapper() {
  const { theme, setTheme } = useTheme();
  
  return <Navbar currentTheme={theme} onThemeChange={setTheme} />;
}
