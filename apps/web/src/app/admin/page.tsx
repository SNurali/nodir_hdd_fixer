"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import {
  Users, FileText, Activity, Settings, TrendingUp,
  Database, Server, Cpu, MemoryStick, HardDrive, Wifi
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    {
      title: 'Мониторинг Сервера',
      description: 'CPU, RAM, Disk, Health Checks',
      icon: Activity,
      color: 'blue',
      href: '/admin/monitoring',
      stats: 'Real-time',
    },
    {
      title: 'Пользователи',
      description: 'Управление пользователями и ролями',
      icon: Users,
      color: 'green',
      href: '/admin/users',
      stats: 'Все пользователи',
    },
    {
      title: 'Заказы',
      description: 'Управление заказами',
      icon: FileText,
      color: 'purple',
      href: '/admin/orders',
      stats: 'Все заказы',
    },
    {
      title: 'Настройки',
      description: 'Конфигурация системы',
      icon: Settings,
      color: 'gray',
      href: '/admin/settings',
      stats: 'Скоро',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RECOVERY.UZ</h1>
              <span className="text-sm text-gray-500">Админ-панель</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">{user.full_name}</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                На главную
              </button>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            👋 Добро пожаловать, {user.full_name}!
          </h2>
          <p className="text-gray-500">
            Выберите раздел для управления системой
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Сервисы"
            value="3"
            subtitle="Online"
            icon={Server}
            color="green"
          />
          <StatCard
            title="Uptime"
            value="99.9%"
            subtitle="За 30 дней"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Заказов"
            value="—"
            subtitle="Активных"
            icon={FileText}
            color="purple"
          />
          <StatCard
            title="Пользователей"
            value="—"
            subtitle="Всего"
            icon={Users}
            color="green"
          />
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <MenuItem key={item.href} {...item} />
          ))}
        </div>

        {/* System Info */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold mb-4">📊 Информация о системе</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Версия:</span>
              <span className="ml-2 font-medium">v2.0.0</span>
            </div>
            <div>
              <span className="text-gray-500">Последнее обновление:</span>
              <span className="ml-2 font-medium">14.03.2026</span>
            </div>
            <div>
              <span className="text-gray-500">Статус:</span>
              <span className="ml-2 font-medium text-green-600">✅ Активен</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ title, description, icon: Icon, color, href, stats, onClick }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700',
  };

  const iconColors: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    gray: 'text-gray-500',
  };

  return (
    <button
      onClick={onClick || (() => window.location.href = href)}
      className={`${colors[color]} border-2 rounded-xl p-6 transition-all text-left hover:shadow-lg hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`${iconColors[color]}`} size={32} />
        <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-500">
          {stats}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </button>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
