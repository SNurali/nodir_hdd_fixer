"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-provider';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Headphones,
  HardDrive,
} from 'lucide-react';
import api from '@/lib/api';
import { Logo } from '@/components/logo';
import { CyberBackgroundSimple } from '@/components/cyber-background';
import { GoogleSignInButton, AuthDivider } from '@/components/google-sign-in-button';
import { PhoneInput } from '@/components/phone-input';
import { getApiBaseUrl } from '@/lib/api-url';

type AuthMode = 'login' | 'forgot' | 'reset';
type LoginType = 'phone' | 'email';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { theme } = useTheme();
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n() as any;

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('reset_token');
    const oauthSuccess = urlParams.get('oauth');

    // Handle OAuth success redirect
    if (oauthSuccess === 'success') {
      setInfo('Авторизация через Google успешна! Загрузка...');
      // Clear the query param and refresh auth state
      window.history.replaceState({}, document.title, window.location.pathname);
      // The cookies are already set by the backend, so we just need to refresh the page
      // to trigger the auth provider to pick up the new session
      window.location.reload();
      return () => clearTimeout(mountTimer);
    }

    if (tokenFromUrl) {
      setMode('reset');
      setResetToken(tokenFromUrl);
      setInfo('Введите новый пароль для завершения сброса.');
      return () => clearTimeout(mountTimer);
    }

    // Auto-redirect if already authenticated
    if (!authLoading && user) {
      const dashboardPath = user.role === 'master' ? '/master/dashboard' : '/';
      router.replace(dashboardPath);
    }

    return () => clearTimeout(mountTimer);
  }, [authLoading, router, user]);

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth endpoint
    const apiBaseUrl = getApiBaseUrl();
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const identifier = loginType === 'phone' ? phone : email;

    try {
      await login(identifier, password);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const normalizedLogin = (loginType === 'phone' ? phone : email).trim();
    if (!normalizedLogin) {
      setError('Введите номер телефона или email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { login: normalizedLogin });
      setInfo(data?.message || 'Если аккаунт существует, инструкция по сбросу отправлена.');

      if (data?.debug_reset_token) {
        setResetToken(data.debug_reset_token);
        setMode('reset');
        setInfo(`Тестовый токен: ${data.debug_reset_token}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось отправить запрос на сброс');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        new_password: newPassword,
      });

      setInfo(data?.message || 'Пароль успешно обновлён. Войдите с новым паролем.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный или истёкший токен сброса');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden ${
      isDark ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      {/* Background */}
      <CyberBackgroundSimple />

      <main className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        <div className="max-w-md mx-auto w-full">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="relative inline-block mb-6">
              <Logo size={80} animated={true} />
              <div className={`absolute inset-0 blur-3xl rounded-full -z-10 ${
                isDark ? 'bg-sky-500/30' : 'bg-sky-400/30'
              }`} />
            </div>
            
            <h1 className={`text-3xl font-bold mb-2 tracking-tight ${
              isDark 
                ? 'bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
            }`}>
              RECOVERY.UZ
            </h1>
            <p className={isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>
              {t('login.service_subtitle')}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                isDark 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                <HardDrive className="inline-block w-3 h-3 mr-1" />
                {t('login.tagline')}
              </span>
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-3xl p-8 border backdrop-blur-xl ${
              isDark 
                ? 'bg-slate-900/70 border-slate-800/60 shadow-2xl shadow-sky-500/5'
                : 'bg-white/80 border-slate-200/60 shadow-2xl shadow-slate-500/10'
            }`}
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20"
              >
                <p className="text-sm text-rose-500 text-center font-medium">{error}</p>
              </motion.div>
            )}

            {/* Info Message */}
            {info && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 mb-6 rounded-2xl bg-sky-500/10 border border-sky-500/20"
              >
                <p className="text-sm text-sky-500 text-center font-medium">{info}</p>
              </motion.div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <>
                {/* Google Sign In */}
                <GoogleSignInButton
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  theme={isDark ? "dark" : "light"}
                  hideIfNotConfigured={true}
                />

                <AuthDivider text="или" theme={isDark ? "dark" : "light"} />

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Login Type Toggle */}
                <div className={`flex rounded-xl p-1 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <button
                    type="button"
                    onClick={() => { setLoginType('phone'); setPhone(''); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      loginType === 'phone'
                        ? isDark 
                          ? 'bg-slate-700 text-sky-400 shadow-lg'
                          : 'bg-white text-sky-600 shadow-md'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone size={16} />
                    Телефон
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginType('email'); setPhone(''); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      loginType === 'email'
                        ? isDark 
                          ? 'bg-slate-700 text-sky-400 shadow-lg'
                          : 'bg-white text-sky-600 shadow-md'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                </div>

                {/* Phone or Email Input */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {loginType === 'phone' ? 'Номер телефона' : 'Электронная почта'}
                  </label>
                  <div>
                    {loginType === 'phone' ? (
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        name="login"
                        required
                        disabled={loading}
                        autoComplete="tel"
                        wrapperClassName={isDark
                          ? 'bg-slate-800 border-slate-700 focus-within:border-sky-500/50 focus-within:ring-sky-500/20'
                          : 'bg-white border-slate-200 focus-within:border-sky-500/50 focus-within:ring-sky-500/20'}
                        buttonClassName={isDark
                          ? 'border-slate-700 hover:bg-slate-700/80'
                          : 'border-slate-200 hover:bg-slate-50'}
                        inputClassName={isDark
                          ? 'text-slate-100 placeholder:text-slate-500'
                          : 'text-slate-900 placeholder:text-slate-400'}
                        dropdownClassName={isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                        searchClassName={isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100'
                          : 'border-slate-200 bg-slate-50 text-slate-900'}
                      />
                    ) : (
                      <>
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`} size={20} />
                        <input
                          type="email"
                          name="login"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@mail.uz"
                          className={`w-full rounded-xl py-3 pl-12 pr-4 text-base outline-none transition-all duration-300 ${
                            isDark
                              ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500'
                              : 'bg-white border border-slate-200 text-slate-900 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-400'
                          }`}
                          disabled={loading}
                          autoComplete="off"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full rounded-xl py-3 pl-12 pr-12 text-base outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500'
                          : 'bg-white border border-slate-200 text-slate-900 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-400'
                      }`}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setInfo('');
                    }}
                    className={`text-sm font-medium transition-all hover:underline ${
                      isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
                    }`}
                  >
                    Забыли пароль?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <>
                      Войти
                      <ArrowRight size={22} />
                    </>
                  )}
                </button>
              </form>
            </>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <KeyRound className="text-white" size={32} />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Восстановление пароля
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Введите телефон или email, указанный при регистрации
                  </p>
                </div>

                <div className={`flex rounded-xl p-1 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <button
                    type="button"
                    onClick={() => { setLoginType('phone'); setPhone(''); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      loginType === 'phone'
                        ? isDark
                          ? 'bg-slate-700 text-amber-400 shadow-lg'
                          : 'bg-white text-amber-600 shadow-md'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone size={16} />
                    Телефон
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginType('email'); setPhone(''); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      loginType === 'email'
                        ? isDark
                          ? 'bg-slate-700 text-amber-400 shadow-lg'
                          : 'bg-white text-amber-600 shadow-md'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {loginType === 'phone' ? 'Номер телефона' : 'Email'}
                  </label>
                  {loginType === 'phone' ? (
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      name="forgot_login"
                      required
                      disabled={loading}
                      autoComplete="tel"
                      wrapperClassName={isDark
                        ? 'bg-slate-800 border-slate-700 focus-within:border-amber-500/50 focus-within:ring-amber-500/20'
                        : 'bg-white border-slate-200 focus-within:border-amber-500/50 focus-within:ring-amber-500/20'}
                      buttonClassName={isDark
                        ? 'border-slate-700 hover:bg-slate-700/80'
                        : 'border-slate-200 hover:bg-slate-50'}
                      inputClassName={isDark
                        ? 'text-slate-100 placeholder:text-slate-500'
                        : 'text-slate-900 placeholder:text-slate-400'}
                      dropdownClassName={isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                      searchClassName={isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-100'
                        : 'border-slate-200 bg-slate-50 text-slate-900'}
                    />
                  ) : (
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`} size={20} />
                      <input
                        type="email"
                        name="forgot_login"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.uz"
                        className={`w-full rounded-xl py-3 pl-12 pr-4 text-base outline-none transition-all duration-300 ${
                          isDark
                            ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder-slate-500'
                            : 'bg-white border border-slate-200 text-slate-900 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder-slate-400'
                        }`}
                        disabled={loading}
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <>Отправить код <ArrowRight size={22} /></>}
                </button>

                <button
                  type="button"
                  disabled={loading}
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setInfo('');
                    }}
                  className={`w-full flex items-center justify-center gap-2 py-3 font-medium transition-all ${
                    isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowLeft size={18} />
                  Вернуться ко входу
                </button>
              </form>
            )}

            {/* Reset Password Form */}
            {mode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Lock className="text-white" size={32} />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Новый пароль
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Придумайте надёжный пароль для вашего аккаунта
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Токен сброса
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Вставьте токен из письма/SMS"
                    className={`w-full rounded-xl py-3 px-4 text-base outline-none transition-all duration-300 font-mono text-sm ${
                      isDark
                        ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500'
                        : 'bg-white border border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400'
                    }`}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Новый пароль
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className={`w-full rounded-xl py-3 pl-12 pr-12 text-base outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500'
                          : 'bg-white border border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400'
                      }`}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className={`w-full rounded-xl py-3 pl-12 pr-12 text-base outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500'
                          : 'bg-white border border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400'
                      }`}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <>Сбросить пароль <ArrowRight size={22} /></>}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setResetToken('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 font-medium transition-all ${
                    isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowLeft size={18} />
                  Вернуться ко входу
                </button>
              </form>
            )}

            {/* Register Link */}
            {mode === 'login' && (
              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <p className={`text-center text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Нет аккаунта?
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap size={20} />
                  Создать аккаунт
                </button>
              </div>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-900/50 border-slate-800/50'
                : 'bg-white/60 border-slate-200/50'
            }`}>
              <div className="grid grid-cols-3 gap-4">
                <FeatureItem 
                  icon={Shield} 
                  label="Безопасность" 
                  theme={theme}
                  color="emerald"
                />
                <FeatureItem 
                  icon={Zap} 
                  label="Скорость" 
                  theme={theme}
                  color="sky"
                />
                <FeatureItem 
                  icon={Headphones} 
                  label="Поддержка 24/7" 
                  theme={theme}
                  color="purple"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Feature Item Component
interface FeatureItemProps {
  icon: React.ElementType;
  label: string;
  theme: string;
  color: 'emerald' | 'sky' | 'purple';
}

function FeatureItem({ icon: Icon, label, theme, color }: FeatureItemProps) {
  const isDark = theme === 'dark';
  
  const getColors = () => {
    switch (color) {
      case 'emerald':
        return isDark 
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-emerald-100 text-emerald-600';
      case 'sky':
        return isDark 
          ? 'bg-sky-500/10 text-sky-400'
          : 'bg-sky-100 text-sky-600';
      case 'purple':
        return isDark 
          ? 'bg-purple-500/10 text-purple-400'
          : 'bg-purple-100 text-purple-600';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColors()}`}>
        <Icon size={20} />
      </div>
      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  );
}
