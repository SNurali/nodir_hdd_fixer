"use client";

import React, { useState, useEffect } from 'react';
import {
  Package,
  Wrench,
  TrendingUp,
  Search,
  CheckCircle2,
  LogOut,
  Plus,
  Users,
  Settings,
  FileText,
  Sparkles,
  HardDrive,
  Activity,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useAuth } from './auth-provider';
import { useTheme } from '@/components/theme-provider';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { DashboardOrderTable } from '@/features/dashboard/components/dashboard-order-table';
import { DashboardStatCard } from '@/features/dashboard/components/dashboard-stat-card';
import { Logo } from '@/components/logo';
import { CyberBackground } from '@/components/cyber-background';
import { motion } from 'framer-motion';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Animated Background */}
      <CyberBackground />

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.header 
            variants={itemVariants}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Logo size={56} animated={true} />
                <div className={`absolute inset-0 blur-2xl rounded-full -z-10 ${
                  theme === 'dark' ? 'bg-sky-500/30' : 'bg-sky-400/30'
                }`} />
              </div>
              <div>
                <h1 className={`text-3xl font-bold tracking-tight ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
                }`}>
                  HDD FIXER
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t('common.dashboard')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-sky-100 text-sky-700 border border-sky-200'
                  }`}>
                    {t(`role.${user.role}`)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className={`relative hidden md:block w-72 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  className={`w-full rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border border-slate-800 text-slate-100 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500'
                      : 'bg-white border border-slate-200 text-slate-900 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={`rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 border border-slate-800 text-slate-100 hover:border-slate-700'
                    : 'bg-white border border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
              >
                <option value="ru">{t('profile.language_ru')}</option>
                <option value="en">{t('profile.language_en')}</option>
                <option value="uz-cyr">{t('profile.language_uz_cyr')}</option>
                <option value="uz-lat">{t('profile.language_uz_lat')}</option>
              </select>

              {/* Logout */}
              <button
                onClick={logout}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                    : 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
                }`}
                title={t('common.logout')}
              >
                <LogOut size={20} />
              </button>

              {/* Profile */}
              <div
                onClick={() => router.push('/profile')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold cursor-pointer transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-sky-500 to-purple-600 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-gradient-to-br from-sky-500 to-purple-600 text-white shadow-lg shadow-sky-500/30'
                }`}
              >
                {user.full_name[0].toUpperCase()}
              </div>
            </div>
          </motion.header>

          {/* Stats Grid - Only for admin/operator */}
          {isAdminOrOperator && (
            <motion.div 
              variants={itemVariants}
              className={`grid grid-cols-1 md:grid-cols-2 ${showFinanceWidgets ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-10`}
            >
              <StatCard
                title={t('dashboard.total_orders')}
                value={stats?.totalOrders || '0'}
                change={totalOrdersChange}
                icon={Package}
                trend={totalOrdersTrend}
                theme={theme}
                gradient="from-sky-500 to-indigo-500"
              />
              <StatCard
                title={t('dashboard.active_repairs')}
                value={stats?.activeRepairs || '0'}
                icon={Wrench}
                trend="up"
                theme={theme}
                gradient="from-indigo-500 to-purple-500"
              />
              <StatCard
                title={t('dashboard.completed_today')}
                value={stats?.completedToday || '0'}
                icon={CheckCircle2}
                trend="up"
                theme={theme}
                gradient="from-emerald-500 to-cyan-500"
              />
              {showFinanceWidgets && (
                <StatCard
                  title={t('dashboard.total_revenue')}
                  value={`${(stats?.totalRevenue || 0).toLocaleString()} UZS`}
                  icon={TrendingUp}
                  trend="up"
                  theme={theme}
                  gradient="from-amber-500 to-rose-500"
                />
              )}
            </motion.div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 flex flex-col gap-8"
            >
              <DashboardOrderTable theme={theme} />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col gap-6"
            >
              {/* Quick Actions */}
              <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/60 backdrop-blur-xl'
                  : 'bg-white/80 border-slate-200/60 backdrop-blur-xl shadow-xl'
              }`}>
                <h2 className={`text-lg font-bold mb-5 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  <Sparkles className="text-sky-500" size={20} />
                  {t('dashboard.quick_actions')}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <ActionButton
                    onClick={() => router.push('/orders/new')}
                    icon={Plus}
                    label={t('dashboard.new_order')}
                    theme={theme}
                    primary
                  />
                  {isAdminOperatorMaster && (
                    <ActionButton
                      onClick={() => router.push('/clients')}
                      icon={Users}
                      label={t('common.clients')}
                      theme={theme}
                    />
                  )}
                  {user.role === 'admin' && (
                    <ActionButton
                      onClick={() => router.push('/management')}
                      icon={Settings}
                      label={t('dashboard.system_setup')}
                      theme={theme}
                      variant="sky"
                    />
                  )}
                  {(user.role === 'admin' || user.role === 'operator') && (
                    <ActionButton
                      onClick={() => router.push('/reports')}
                      icon={FileText}
                      label={t('common.reports')}
                      theme={theme}
                      variant="emerald"
                    />
                  )}
                  {user.role === 'admin' && (
                    <ActionButton
                      onClick={() => router.push('/admin/users')}
                      icon={Users}
                      label={t('common.users')}
                      theme={theme}
                      variant="purple"
                    />
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/60 backdrop-blur-xl'
                  : 'bg-white/80 border-slate-200/60 backdrop-blur-xl shadow-xl'
              }`}>
                <h2 className={`text-lg font-bold mb-5 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  <Activity className="text-emerald-500" size={20} />
                  {t('dashboard.system_status')}
                </h2>
                <div className="space-y-4">
                  <StatusItem
                    icon={HardDrive}
                    label="Система хранения"
                    status="online"
                    theme={theme}
                  />
                  <StatusItem
                    icon={Clock}
                    label="Синхронизация"
                    status="syncing"
                    theme={theme}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
  theme: string;
  gradient: string;
}

function StatCard({ title, value, change, icon: Icon, trend, theme, gradient }: StatCardProps) {
  return (
    <div className={`relative p-6 rounded-2xl border overflow-hidden group transition-all duration-300 hover:scale-[1.02] ${
      theme === 'dark'
        ? 'bg-slate-900/60 border-slate-800/60 backdrop-blur-xl'
        : 'bg-white/80 border-slate-200/60 backdrop-blur-xl shadow-lg'
    }`}>
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${
              trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}

// Action Button Component
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  theme: string;
  primary?: boolean;
  variant?: 'default' | 'sky' | 'emerald' | 'purple';
}

function ActionButton({ onClick, icon: Icon, label, theme, primary, variant = 'default' }: ActionButtonProps) {
  const getVariantClasses = () => {
    if (primary) {
      return theme === 'dark'
        ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40'
        : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40';
    }
    
    switch (variant) {
      case 'sky':
        return theme === 'dark'
          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
          : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100';
      case 'emerald':
        return theme === 'dark'
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
      case 'purple':
        return theme === 'dark'
          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100';
      default:
        return theme === 'dark'
          ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${getVariantClasses()}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// Status Item Component
interface StatusItemProps {
  icon: React.ElementType;
  label: string;
  status: 'online' | 'offline' | 'syncing';
  theme: string;
}

function StatusItem({ icon: Icon, label, status, theme }: StatusItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'syncing':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${
      theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100/50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}>
          <Icon size={16} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
        </div>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {status === 'online' ? 'Онлайн' : status === 'syncing' ? 'Синхронизация' : 'Офлайн'}
        </span>
      </div>
    </div>
  );
}
