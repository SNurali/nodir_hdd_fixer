"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth-provider';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { getPublicApiUrl } from '@/lib/api-url';
import {
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
  X,
  Home,
  FileText,
  Settings,
  Wrench,
  Users,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz-lat', label: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'uz-cyr', label: 'Ўзбекча', flag: '🇺🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface NavbarProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
  currentTheme?: 'light' | 'dark';
}

export default function Navbar({ onThemeChange, currentTheme }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 0);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme && onThemeChange) {
      onThemeChange(savedTheme);
    }

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, [onThemeChange]);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleOpenProfile = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/profile');
  };

  const avatarSrc = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${getPublicApiUrl()}${user.avatar_url}`)
    : null;

  const navItems = [
    { icon: Home, label: t('common.dashboard'), href: '/' },
    { icon: FileText, label: t('common.orders'), href: user?.role === 'admin' || user?.role === 'operator' ? '/admin/orders' : '/orders/new' },
    { icon: Wrench, label: t('common.services'), href: '/management' },
    ...(user?.role === 'admin' || user?.role === 'operator' || user?.role === 'master'
      ? [{ icon: Settings, label: t('common.clients'), href: '/clients' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ icon: Users, label: t('common.users'), href: '/admin/users' }]
      : []),
  ];

  if (!mounted) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${currentTheme === 'dark'
      ? 'bg-gray-900/95 border-gray-800'
      : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wrench className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('login.service_title')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline-block`} style={{ letterSpacing: '0.5px' }}>
                  {t('login.tagline')}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                  <HardDrive size={10} />
                  {t('navbar.data_recovery_badge')}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, idx) => (
              <button
                key={`${item.href}-${idx}`}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentTheme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className={`flex items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${currentTheme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span>{currentLang.flag}</span>
                <span className="text-xs font-medium uppercase">{currentLang.code.split('-')[0]}</span>
              </button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-40 rounded-2xl shadow-xl border overflow-hidden ${currentTheme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <div className="p-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as any);
                            setIsLanguageOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${language === lang.code
                            ? (currentTheme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                            : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                            }`}
                        >
                          <span className="text-base">{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${currentTheme === 'dark'
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${currentTheme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {user.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {user.full_name}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border overflow-hidden ${currentTheme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                        }`}
                    >
                      <div className={`px-4 py-3 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{user.full_name}</p>
                        <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>{user.role}</p>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={handleOpenProfile}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${currentTheme === 'dark'
                            ? 'text-gray-200 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          <User size={18} />
                          {t('common.profile_settings')}
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                        >
                          <LogOut size={18} />
                          {t('common.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-200 ${currentTheme === 'dark'
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t overflow-hidden ${currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, idx) => (
                <button
                  key={`${item.href}-${idx}`}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTheme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}

              <div className={`mt-2 pt-2 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`px-4 py-2 text-xs font-semibold ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('navbar.language')}
                </p>
                <div className="grid grid-cols-2 gap-2 px-4 mb-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${language === lang.code
                        ? (currentTheme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                        : (currentTheme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')
                        }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <button
                  onClick={handleOpenProfile}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTheme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <User size={18} />
                  {t('common.profile_settings')}
                </button>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                >
                  <LogOut size={18} />
                  {t('common.logout')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for dropdowns */}
      {(isProfileOpen || isLanguageOpen) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setIsProfileOpen(false);
            setIsLanguageOpen(false);
          }}
        />
      )}
    </nav>
  );
}
