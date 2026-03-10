"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-provider';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';
import {
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import api from '@/lib/api';

type AuthMode = 'login' | 'forgot' | 'reset';

export default function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await login(loginIdentifier, password);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
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
                <div>
                  <label className="input-label">{t('login.phone_or_email')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={t('login.phone_placeholder')}
                      className="input-field pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">{t('login.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.password_placeholder')}
                      className="input-field pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('forgot');
                    setForgotLogin(loginIdentifier);
                    setError('');
                    setInfo('');
                  }}
                  className="w-full text-left text-sm text-blue-600 hover:underline"
                >
                  Забыли пароль?
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <>
                      {t('login.sign_in')}
                      <ArrowRight size={22} />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="flex items-center gap-2 text-gray-700">
                  <KeyRound size={18} />
                  <h2 className="font-semibold">Восстановление пароля</h2>
                </div>

                <div>
                  <label className="input-label">Номер телефона или Email</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={forgotLogin}
                      onChange={(e) => setForgotLogin(e.target.value)}
                      placeholder="Введите номер или email"
                      className="input-field pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <>Отправить <ArrowRight size={22} /></>}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setInfo('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={16} />
                  Назад ко входу
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="flex items-center gap-2 text-gray-700">
                  <KeyRound size={18} />
                  <h2 className="font-semibold">Сброс пароля</h2>
                </div>

                <div>
                  <label className="input-label">Токен сброса</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Вставьте токен из письма/SMS"
                    className="input-field"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="input-label">Новый пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="input-field pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Подтвердите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className="input-field pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <>Сбросить пароль <ArrowRight size={22} /></>}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={16} />
                  Назад ко входу
                </button>
              </form>
            )}

            {mode === 'login' && (
              <>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Wrench size={20} />
                    {t('login.order_without_register')}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push('/register')}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t('login.register')}
                  </button>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Безопасная система</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Мгновенные уведомления</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
