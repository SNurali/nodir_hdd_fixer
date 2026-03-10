"use client";

import React, { useState, useEffect } from 'react';
import {
  Package,
  Wrench,
  TrendingUp,
  Search,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useAuth } from './auth-provider';
import { useTheme } from '@/components/theme-provider';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { DashboardOrderTable } from '@/features/dashboard/components/dashboard-order-table';
import { DashboardStatCard } from '@/features/dashboard/components/dashboard-stat-card';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { t, language, setLanguage }: any = useI18n();
  const { user, logout, isLoading: authLoading }: any = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const isAdminOrOperator = user?.role === 'admin' || user?.role === 'operator';
  const isAdminOperatorMaster = user?.role === 'admin' || user?.role === 'operator' || user?.role === 'master';
  const isClient = user?.role === 'client';
  const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, fetcher);
  const rolePreferences = settingsData?.settings?.role_preferences || {};
  const dashboardPeriod = user?.role === 'admin' ? rolePreferences.dashboard_period || 'week' : 'week';
  const showFinanceWidgets = user?.role === 'admin' ? rolePreferences.show_finance_widgets !== false : true;

  // Show stats only for admin/operator
  const statsEndpoint = user && isAdminOrOperator
    ? `/orders/stats?period=${dashboardPeriod}`
    : null;
  const { data: stats } = useSWR(statsEndpoint, fetcher);
  const ordersTrendPercent = Number(stats?.ordersTrendPercent || 0);
  const totalOrdersTrend = ordersTrendPercent > 0 ? 'up' : ordersTrendPercent < 0 ? 'down' : 'neutral';
  const totalOrdersChange = `${ordersTrendPercent > 0 ? '+' : ''}${ordersTrendPercent}%`;

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login');
    }
  }, [mounted, user, authLoading, router]);

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 lg:p-12 relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      {/* Background Orbs */}
      <div className={`absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 blur-[120px] rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-200/50'
        }`} />
      <div className={`absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 blur-[120px] rounded-full ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-200/30'
        }`} />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Wrench className="text-white" size={20} />
            </div>
            <h1 className={`text-3xl font-bold tracking-tight italic ${theme === 'dark'
              ? 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'
              }`}>
              HDD FIXER
            </h1>
          </div>
          <p className={`mt-1 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('common.dashboard')} — <span className="text-blue-500 uppercase tracking-widest text-xs px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20 ml-2">{t(`role.${user.role}`)}</span>
          </p>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`} style={{ letterSpacing: '0.5px' }}>
            {t('login.service_subtitle')}
          </p>
          <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} style={{ letterSpacing: '0.5px' }}>
            {t('login.tagline')}
          </p>
          <p className={`mt-1 text-sm italic ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} style={{ letterSpacing: '0.3px' }}>
            {t('login.motto')}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className={`rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer transition-colors ${theme === 'dark'
              ? 'bg-gray-900 border border-gray-800 text-white hover:bg-gray-800'
              : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
              }`}
          >
            <option value="ru" className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>{t('profile.language_ru')}</option>
            <option value="en" className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>{t('profile.language_en')}</option>
            <option value="uz-cyr" className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>{t('profile.language_uz_cyr')}</option>
            <option value="uz-lat" className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>{t('profile.language_uz_lat')}</option>
          </select>

          <div className="relative hidden md:block w-72">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} size={18} />
            <input
              type="text"
              placeholder={t('common.search')}
              className={`w-full rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                ? 'bg-gray-900 border border-gray-800 text-white focus:border-blue-500 placeholder-gray-500'
                : 'bg-white border border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                }`}
            />
          </div>

          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-lg shadow-red-500/30"
            title={t('common.logout')}
          >
            <LogOut size={20} />
          </button>

          <div
            onClick={() => router.push('/profile')}
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 cursor-pointer hover:scale-110 transition-transform"
            title={t('profile.title')}
          >
            {user.full_name[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Stats Grid - Only for admin/operator */}
      {isAdminOrOperator && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${showFinanceWidgets ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-12 relative z-10`}>
          <DashboardStatCard title={t('dashboard.total_orders')} value={stats?.totalOrders || '0'} change={totalOrdersChange} icon={Package} trend={totalOrdersTrend} theme={theme} />
          <DashboardStatCard title={t('dashboard.active_repairs')} value={stats?.activeRepairs || '0'} icon={Wrench} trend="up" theme={theme} />
          <DashboardStatCard title={t('dashboard.completed_today')} value={stats?.completedToday || '0'} icon={CheckCircle2} trend="up" theme={theme} />
          {showFinanceWidgets && (
            <DashboardStatCard title={t('dashboard.total_revenue')} value={`${(stats?.totalRevenue || 0).toLocaleString()} UZS`} icon={TrendingUp} trend="up" theme={theme} />
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <DashboardOrderTable theme={theme} />
        </div>

        <div className="flex flex-col gap-6">
          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white border-gray-200 shadow-lg'
            }`}>
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
              {t('dashboard.quick_actions')}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => router.push('/orders/new')}
                className={`w-full justify-center font-bold py-4 h-auto rounded-xl transition-all duration-200 flex items-center gap-2 ${theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                  }`}
              >
                {t('dashboard.new_order')}
              </button>
              {isAdminOperatorMaster && (
                <button
                  onClick={() => router.push('/clients')}
                  className={`w-full justify-center font-medium py-4 h-auto rounded-xl transition-colors ${theme === 'dark'
                    ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  {t('common.clients')}
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/management')}
                  className={`w-full justify-center font-medium py-4 h-auto rounded-xl transition-colors border ${theme === 'dark'
                    ? 'bg-gray-800 text-blue-400 border-blue-500/30 hover:bg-gray-700'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-gray-50'
                    }`}
                >
                  {t('dashboard.system_setup')}
                </button>
              )}
              {(user.role === 'admin' || user.role === 'operator') && (
                <button
                  onClick={() => router.push('/reports')}
                  className={`w-full justify-center font-medium py-4 h-auto rounded-xl transition-colors border ${theme === 'dark'
                    ? 'bg-gray-800 text-green-400 border-green-500/30 hover:bg-gray-700'
                    : 'bg-white text-green-600 border-green-200 hover:bg-gray-50'
                    }`}
                >
                  {t('common.reports')}
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin/users')}
                  className={`w-full justify-center font-medium py-4 h-auto rounded-xl transition-colors border ${theme === 'dark'
                    ? 'bg-gray-800 text-purple-400 border-purple-500/30 hover:bg-gray-700'
                    : 'bg-white text-purple-600 border-purple-200 hover:bg-gray-50'
                    }`}
                >
                  {t('common.users')}
                </button>
              )}
            </div>
          </div>

          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white border-gray-200 shadow-lg'
            }`}>
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full" />
              {t('dashboard.system_alerts')}
            </h2>
            <div className="space-y-4">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
