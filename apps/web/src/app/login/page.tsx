"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-provider';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  CheckCircle2,
  KeyRound,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '@/lib/api';

type AuthMode = 'login' | 'forgot' | 'reset';
type LoginType = 'phone' | 'email';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('phone');
  const [phone, setPhone] = useState('+998');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotLogin, setForgotLogin] = useState('');
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

    const tokenFromUrl = new URLSearchParams(window.location.search).get('reset_token');
    if (tokenFromUrl) {
      setMode('reset');
      setResetToken(tokenFromUrl);
      setInfo('Введите новый пароль для завершения сброса.');
      return () => clearTimeout(mountTimer);
    }

    if (!authLoading && user) {
      router.replace('/');
    }

    return () => clearTimeout(mountTimer);
  }, [authLoading, router, user]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(3);
    if (digits.length === 0) {
      setPhone('+998');
    } else {
      setPhone('+998' + digits.slice(0, 9));
    }
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

    const normalizedLogin = forgotLogin.trim();
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
      setForgotLogin('');
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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      <main className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-emerald-500 shadow-blue-500/25">
              <Wrench className="text-white" size={40} />
            </div>
            <h1 className={`text-2xl font-extrabold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('login.service_title')}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-400 font-medium' : 'text-gray-600 font-medium'}>
              {t('login.service_subtitle')}
            </p>
            <p className="mt-2 text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full inline-block">
              {t('login.tagline')}
            </p>
            <p className={`mt-1 text-sm italic ${theme === 'dark' ? 'text-sky-300' : 'text-sky-700'}`}>
              {t('login.motto')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`card p-8 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 mb-4 rounded-2xl bg-red-50 border border-red-100"
              >
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </motion.div>
            )}

            {info && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 mb-4 rounded-2xl bg-blue-50 border border-blue-100"
              >
                <p className="text-sm text-blue-700 text-center font-medium">{info}</p>
              </motion.div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Login Type Toggle */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => { setLoginType('phone'); setPhone('+998'); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      loginType === 'phone'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Smartphone size={16} />
                    Телефон
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginType('email'); setPhone('+998'); setEmail(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      loginType === 'email'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                </div>

                {/* Phone or Email Input */}
                <div>
                  <label className="input-label">
                    {loginType === 'phone' ? 'Номер телефона' : 'Электронная почта'}
                  </label>
                  <div className="relative">
                    {loginType === 'phone' ? (
                      <>
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="+998 90 123 45 67"
                          className="input-field pl-12"
                          disabled={loading}
                          autoComplete="off"
                        />
                      </>
                    ) : (
                      <>
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@mail.uz"
                          className="input-field pl-12"
                          disabled={loading}
                          autoComplete="off"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="input-label">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-12 pr-12"
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      setForgotLogin(loginType === 'phone' ? phone : email);
                      setError('');
                      setInfo('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-all"
                  >
                    Забыли пароль?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
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
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <KeyRound className="text-white" size={32} />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Восстановление пароля
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Введите телефон или email, указанный при регистрации
                  </p>
                </div>

                <div>
                  <label className="input-label">Номер телефона или Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={forgotLogin}
                      onChange={(e) => setForgotLogin(e.target.value)}
                      placeholder="+998 90 123 45 67 или example@mail.uz"
                      className="input-field pl-12"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
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
                    setForgotLogin('');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-all"
                >
                  <ArrowLeft size={18} />
                  Вернуться ко входу
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Lock className="text-white" size={32} />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Новый пароль
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Придумайте надёжный пароль для вашего аккаунта
                  </p>
                </div>

                <div>
                  <label className="input-label">Токен сброса</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Вставьте токен из письма/SMS"
                    className="input-field font-mono"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="input-label">Новый пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="input-field pl-12 pr-12"
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="input-label">Подтвердите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className="input-field pl-12 pr-12"
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
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
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-all"
                >
                  <ArrowLeft size={18} />
                  Вернуться ко входу
                </button>
              </form>
            )}

            {mode === 'login' && (
              <>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className={`text-center text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Нет аккаунта?
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Wrench size={20} />
                    Создать аккаунт
                  </button>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Безопасное соединение
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-blue-500" />
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Мгновенные уведомления
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-purple-500" />
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Поддержка 24/7
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
