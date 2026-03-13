"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import api from '@/lib/api';
import {
  Activity, Server, Database, HardDrive, Cpu, MemoryStick,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock,
  Terminal, Shield, Wifi
} from 'lucide-react';

interface HealthStatus {
  api: { status: string; uptime: number; timestamp: string };
  database: { status: string; responseTime?: number };
  redis: { status: string; responseTime?: number };
  overall: string;
}

interface ResourceUsage {
  cpu: { current: number; cores: number; model: string };
  memory: { used: number; total: number; percent: number; free: number };
  disk: { used: number; total: number; percent: number; free: number };
  network: { rx_mb: number; tx_mb: number };
}

interface ServiceStatus {
  name: string;
  status: string;
  pid?: number;
  memory?: number;
  cpu?: number;
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [resources, setResources] = useState<ResourceUsage | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [healthRes, resourcesRes, servicesRes] = await Promise.all([
        api.get('/monitoring/health'),
        api.get('/monitoring/resources'),
        api.get('/monitoring/services'),
      ]);

      setHealth(healthRes.data);
      setResources(resourcesRes.data);
      setServices(servicesRes.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка данных мониторинга...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔍 Мониторинг Сервера</h1>
            <p className="text-gray-500">RECOVERY.UZ - Система мониторинга</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Обновить
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Последнее обновление: {lastUpdate.toLocaleTimeString('ru-RU')}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <XCircle className="text-red-500" size={20} />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ServiceCard
            name="API Server"
            status={health?.api.status === 'up' ? 'online' : 'offline'}
            uptime={health?.api.uptime}
            icon={Server}
          />
          <ServiceCard
            name="PostgreSQL"
            status={health?.database.status === 'up' ? 'online' : 'offline'}
            responseTime={health?.database.responseTime}
            icon={Database}
          />
          <ServiceCard
            name="Redis"
            status={health?.redis.status === 'up' ? 'online' : 'offline'}
            responseTime={health?.redis.responseTime}
            icon={Shield}
          />
          <OverallStatus status={health?.overall || 'unknown'} />
        </div>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CPU */}
          <ResourceCard
            title="CPU"
            icon={Cpu}
            value={`${resources?.cpu.current.toFixed(1)}%`}
            details={`${resources?.cpu.cores} ядер`}
            model={resources?.cpu.model}
            color="blue"
          />

          {/* RAM */}
          <ResourceCard
            title="Оперативная память"
            icon={MemoryStick}
            value={`${resources?.memory.percent.toFixed(1)}%`}
            details={`${resources?.memory.used}MB / ${resources?.memory.total}MB`}
            color="purple"
          />

          {/* Disk */}
          <ResourceCard
            title="Диск"
            icon={HardDrive}
            value={`${resources?.disk.percent}%`}
            details={`${resources?.disk.used}GB / ${resources?.disk.total}GB`}
            free={`${resources?.disk.free}GB свободно`}
            color="green"
          />

          {/* Network */}
          <ResourceCard
            title="Сеть"
            icon={Wifi}
            value=""
            details={`↓ ${resources?.network.rx_mb}MB ↑ ${resources?.network.tx_mb}MB`}
            color="cyan"
          />
        </div>

        {/* Services List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Сервисы
          </h2>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {service.status === 'running' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : service.status === 'stopped' ? (
                    <XCircle className="text-red-500" size={20} />
                  ) : (
                    <AlertTriangle className="text-yellow-500" size={20} />
                  )}
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {service.pid && <span>PID: {service.pid}</span>}
                  {service.memory && <span>RAM: {Math.round(service.memory)}MB</span>}
                  {service.cpu && <span>CPU: {service.cpu.toFixed(1)}%</span>}
                  <span className={`px-2 py-1 rounded text-xs ${
                    service.status === 'running'
                      ? 'bg-green-100 text-green-700'
                      : service.status === 'stopped'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Terminal className="text-blue-500" />
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={async () => {
                if (confirm('Перезапустить API сервер?')) {
                  try {
                    await api.post('/monitoring/restart');
                    alert('Перезапуск инициирован');
                  } catch (err: any) {
                    alert('Ошибка: ' + err.response?.data?.message);
                  }
                }
              }}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
            >
              <RefreshCw className="text-blue-500 mb-2" size={24} />
              <p className="font-medium">Перезапустить API</p>
            </button>

            <button
              onClick={() => router.push('/admin/monitoring/logs')}
              className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors"
            >
              <Terminal className="text-purple-500 mb-2" size={24} />
              <p className="font-medium">Просмотр логов</p>
            </button>

            <button
              onClick={async () => {
                if (confirm('Запустить диагностику?')) {
                  try {
                    const res = await api.get('/monitoring/diagnostics');
                    alert('Диагностика завершена: ' + JSON.stringify(res.data));
                  } catch (err: any) {
                    alert('Ошибка: ' + err.response?.data?.message);
                  }
                }
              }}
              className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
            >
              <Activity className="text-green-500 mb-2" size={24} />
              <p className="font-medium">Диагностика</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ name, status, uptime, responseTime, icon: Icon }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className={status === 'online' ? 'text-green-500' : 'text-red-500'} size={24} />
        {status === 'online' ? (
          <CheckCircle className="text-green-500" size={20} />
        ) : (
          <XCircle className="text-red-500" size={20} />
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{name}</p>
      <p className={`text-2xl font-bold ${status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
        {status === 'online' ? 'Online' : 'Offline'}
      </p>
      {uptime && (
        <p className="text-xs text-gray-500 mt-2">
          Uptime: {formatUptime(uptime)}
        </p>
      )}
      {responseTime && (
        <p className="text-xs text-gray-500 mt-2">
          Response: {responseTime}ms
        </p>
      )}
    </div>
  );
}

function ResourceCard({ title, icon: Icon, value, details, model, free, color }: any) {
  const colors: Record<string, string> = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    cyan: 'text-cyan-500',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={colors[color]} size={24} />
        <h3 className="font-bold">{title}</h3>
      </div>
      {value && <p className={`text-3xl font-bold ${colors[color]} mb-2`}>{value}</p>}
      <p className="text-sm text-gray-500">{details}</p>
      {model && <p className="text-xs text-gray-400 mt-1">{model}</p>}
      {free && <p className="text-xs text-gray-400 mt-1">{free}</p>}
    </div>
  );
}

function OverallStatus({ status }: { status: string }) {
  const statusConfig = {
    healthy: { color: 'green', text: 'Здоров', icon: CheckCircle },
    degraded: { color: 'yellow', text: 'Деградирован', icon: AlertTriangle },
    down: { color: 'red', text: 'Не работает', icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`text-${config.color}-500`} size={24} />
      </div>
      <p className="text-sm text-gray-500 mb-1">Общий статус</p>
      <p className={`text-2xl font-bold text-${config.color}-600`}>{config.text}</p>
      <p className="text-xs text-gray-500 mt-2">RECOVERY.UZ</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}
