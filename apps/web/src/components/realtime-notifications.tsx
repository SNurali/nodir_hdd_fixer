'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { socketService } from '@/lib/socket';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Bell, X } from 'lucide-react';

interface ApiNotification {
  id: string;
  template_key?: string;
  payload?: Record<string, any>;
  created_at?: string;
  is_read?: boolean;
}

interface NotificationViewModel {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

function playNotificationTone() {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.03;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
  oscillator.onended = () => {
    void audioContext.close().catch(() => {});
  };
}

export function RealtimeNotifications() {
  const { user } = useAuth();
  const { formatTime } = useAppSettings();
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const shownPopupIds = useRef<Set<string>>(new Set());
  const [soundNotificationsEnabled, setSoundNotificationsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      if (!user || user.role !== 'operator') {
        if (mounted) {
          setSoundNotificationsEnabled(false);
        }
        return;
      }

      try {
        const { data } = await api.get('/users/me/settings');
        if (!mounted) {
          return;
        }

        setSoundNotificationsEnabled(data?.settings?.role_preferences?.sound_notifications !== false);
      } catch {
        if (mounted) {
          setSoundNotificationsEnabled(true);
        }
      }
    };

    void loadSettings();
    return () => {
      mounted = false;
    };
  }, [user]);

  const mapNotification = (item: ApiNotification): NotificationViewModel => {
    const payload = item.payload || {};
    const status = payload.status ? String(payload.status) : null;
    const orderId = payload.orderId ? String(payload.orderId) : null;
    const isStatusChange = item.template_key === 'status_change' || item.template_key === 'order_status_changed';

    const title = isStatusChange
      ? `Статус заказа${orderId ? ` #${orderId}` : ''}`
      : 'Уведомление';

    const message = status
      ? `Изменён на: ${status}`
      : (payload.message ? String(payload.message) : 'Новое событие');

    return {
      id: item.id,
      title,
      message,
      type: isStatusChange ? 'info' : 'success',
      timestamp: item.created_at ? new Date(item.created_at) : new Date(),
      read: !!item.is_read,
    };
  };

  const fetchNotifications = useCallback(async (showClientPopupForUnread: boolean) => {
    if (!user?.id) return;
    try {
      const { data } = await api.get('/notifications?page=1&limit=30');
      const list: ApiNotification[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      const mapped = list.map(mapNotification);
      setNotifications(mapped);

      if (showClientPopupForUnread && user.role === 'client') {
        const unreadStatus = list
          .filter((n) => !n.is_read && (n.template_key === 'status_change' || n.template_key === 'order_status_changed'))
          .slice(0, 5);

        for (const item of unreadStatus) {
          if (shownPopupIds.current.has(item.id)) continue;
          shownPopupIds.current.add(item.id);
          const vm = mapNotification(item);
          toast.info(vm.title, { description: vm.message, duration: 6000 });
        }
      }
    } catch {
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      // Load persisted notifications (for offline status changes)
      const initialLoadId = window.setTimeout(() => {
        void fetchNotifications(true);
      }, 0);

      // Keep fresh with lightweight polling as fallback
      const pollId = window.setInterval(() => {
        void fetchNotifications(false);
      }, 30000);

      // Connect to WebSocket for realtime push
      socketService.connect(user.id);

      const handleNotification = (data: any) => {
        const incoming: NotificationViewModel = {
          id: data.id || `${Date.now()}`,
          title: data.title || 'Уведомление',
          message: data.message || 'Новое событие',
          type: data.type || 'info',
          timestamp: new Date(),
          read: false,
        };

        setNotifications((prev) => {
          const withoutDup = prev.filter((n) => n.id !== incoming.id);
          return [incoming, ...withoutDup].slice(0, 30);
        });

        if (soundNotificationsEnabled) {
          try {
            playNotificationTone();
          } catch {
          }
        }

        switch (incoming.type) {
          case 'success':
            toast.success(incoming.title, { description: incoming.message });
            break;
          case 'warning':
            toast.warning(incoming.title, { description: incoming.message });
            break;
          case 'error':
            toast.error(incoming.title, { description: incoming.message });
            break;
          default:
            toast.info(incoming.title, { description: incoming.message });
        }

        void fetchNotifications(false);
      };

      socketService.onNotification(handleNotification);

      return () => {
        window.clearTimeout(initialLoadId);
        clearInterval(pollId);
        socketService.offNotification(handleNotification);
      };
    }

    const resetId = window.setTimeout(() => setNotifications([]), 0);
    shownPopupIds.current.clear();
    return () => {
      window.clearTimeout(resetId);
    };
  }, [fetchNotifications, soundNotificationsEnabled, user]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch {
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">Уведомления</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Нет уведомлений
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {notification.message}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={markAllAsRead}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Отметить все как прочитанные
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
