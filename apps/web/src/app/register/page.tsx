"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';
import {
  Shield,
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  CheckCircle2,
  Send
} from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998',
    email: '',
    telegram: '',
    password: '',
    confirmPassword: '',
    preferred_language: 'ru'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useI18n() as any;

  useEffect(() => {
    setMounted(true);

    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.access_token) {
          router.push('/');
          return;
        }
      } catch { }
    }

    // Авто-заполнение Telegram если открыто в Telegram Web App
    if (typeof window !== 'undefined' && (window as any).TelegramWebApp) {
      const tg = (window as any).TelegramWebApp;
      const user = tg.initDataUnsafe?.user;
      if (user?.username) {
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || undefined,
        telegram: formData.telegram || undefined,
        password: formData.password,
        preferred_language: formData.preferred_language
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при регистрации');
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

  if (success) {
    return (
      <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <header className="pt-8 px-6 pb-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Назад</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-md mx-auto w-full text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-10"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Регистрация успешна!
              </h2>
              <p className="text-gray-500 mb-8">
                Теперь вы можете войти в систему
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary"
              >
                Войти в систему
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      {/* Header */}
      <header className="pt-8 px-6 pb-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
              {t('login.service_title')} - {t('common.register')}
            </h1>
            <p className="text-gray-500 font-medium">
              {t('login.service_subtitle')}
            </p>
            <p className="mt-2 text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full inline-block">
              {t('login.tagline')}
            </p>
            <p className={`mt-1 text-sm italic ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {t('login.motto')}
            </p>
          </motion.div>

          {/* Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-red-50 border border-red-100"
                >
                  <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                </motion.div>
              )}

              <div>
                <label className="input-label">ФИО</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ваше полное имя"
                    className="input-field pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); const digits = val.slice(0, 9); setFormData({ ...formData, phone: '+998' + digits }); }}
                    className="input-field pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Email (необязательно)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.ru"
                    className="input-field pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="input-label flex items-center gap-2">
                  Telegram (необязательно)
                  <span className="text-xs text-blue-500 font-normal">
                    {formData.telegram ? '✓ Автозаполнено' : ''}
                  </span>
                </label>
                <div className="relative">
                  <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    placeholder="@username или оставьте пустым"
                    className="input-field pl-12"
                    disabled={loading}
                  />
                  {!formData.telegram && (
                    <button
                      type="button"
                      onClick={() => {
                        const tg = (window as any).TelegramWebApp;
                        if (tg?.initDataUnsafe?.user?.username) {
                          setFormData({ ...formData, telegram: `@${tg.initDataUnsafe.user.username}` });
                        } else {
                          window.open('https://telegram.org', '_blank');
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Заполнить
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">
                  💡 Укажите Telegram для быстрой связи
                </p>
              </div>

              <div>
                <label className="input-label">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Повторите пароль"
                    className="input-field pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Язык</label>
                <select
                  value={formData.preferred_language}
                  onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="ru">Русский</option>
                  <option value="uz-lat">O'zbekcha</option>
                  <option value="uz-cyr">Узбекча</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    Зарегистрироваться
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500">Уже есть аккаунт? </span>
              <button
                onClick={() => router.push('/login')}
                className="text-primary font-semibold hover:underline"
              >
                Войти
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
