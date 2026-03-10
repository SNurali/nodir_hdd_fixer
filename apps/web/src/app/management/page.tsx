"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import {
  AlertTriangle,
  ChevronLeft,
  Edit3,
  Loader2,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ManagementTab = 'services' | 'equipments' | 'issues';

type ManagementItem = {
  id: string;
  name_rus: string;
  name_cyr: string;
  name_lat: string;
  name_eng: string;
};

type ManagementForm = {
  name_rus: string;
  name_cyr: string;
  name_lat: string;
  name_eng: string;
};

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const EMPTY_FORM: ManagementForm = {
  name_rus: '',
  name_cyr: '',
  name_lat: '',
  name_eng: '',
};

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const nestedValue =
      record.name_rus ||
      record.name_cyr ||
      record.name_lat ||
      record.name_eng ||
      record.message;

    return nestedValue !== undefined ? asText(nestedValue, fallback) : fallback;
  }

  return fallback;
}

const TAB_CONFIG: Record<ManagementTab, { icon: React.ComponentType<any>; endpoint: string }> = {
  services: { icon: Wrench, endpoint: '/services' },
  equipments: { icon: Smartphone, endpoint: '/equipments' },
  issues: { icon: AlertTriangle, endpoint: '/issues' },
};

export default function ManagementPage() {
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ManagementTab>('services');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagementItem | null>(null);
  const [form, setForm] = useState<ManagementForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const endpoint = TAB_CONFIG[activeTab].endpoint;
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const canView = canManage || user?.role === 'master';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  const { data, isLoading, mutate } = useSWR(canView ? endpoint : null, fetcher);
  const items: ManagementItem[] = Array.isArray(data) ? data : data?.data || [];

  const tabs = useMemo(
    () => [
      { id: 'services' as const, label: asText(t('common.services'), 'Услуги'), icon: Wrench },
      { id: 'equipments' as const, label: asText(t('common.equipments'), 'Оборудование'), icon: Smartphone },
      { id: 'issues' as const, label: asText(t('common.issues'), 'Неисправности'), icon: AlertTriangle },
    ],
    [t],
  );

  const activeEntityLabel =
    activeTab === 'services'
      ? asText(t('common.services'), 'Услуги')
      : activeTab === 'equipments'
        ? asText(t('common.equipments'), 'Оборудование')
        : asText(t('common.issues'), 'Неисправности');

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item: ManagementItem) => {
    setEditingItem(item);
    setForm({
      name_rus: item.name_rus || '',
      name_cyr: item.name_cyr || '',
      name_lat: item.name_lat || '',
      name_eng: item.name_eng || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingItem) {
        await api.patch(`${endpoint}/${editingItem.id}`, form);
        setMessage(`✅ ${asText(t('management.record_updated'), 'Запись обновлена')}`);
      } else {
        await api.post(endpoint, form);
        setMessage(`✅ ${asText(t('management.record_added'), 'Запись добавлена')}`);
      }

      closeModal();
      await mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(asText(err.response?.data?.message ?? err.response?.data, asText(t('management.save_failed'), 'Не удалось сохранить запись')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ManagementItem) => {
    if (!confirm(asText(t('management.delete_confirm'), 'Удалить "{{name}}"? Это действие нельзя отменить.').replace('{{name}}', asText(item.name_rus, 'элемент')))) return;

    setDeletingId(item.id);
    try {
      await api.delete(`${endpoint}/${item.id}`);
      setMessage(`✅ ${asText(t('management.record_deleted'), 'Запись удалена')}`);
      await mutate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`❌ ${asText(err.response?.data?.message ?? err.response?.data, asText(t('management.delete_failed'), 'Не удалось удалить запись'))}`);
    } finally {
      setDeletingId('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{asText(t('management.access_denied'), 'Доступ запрещён')}</p>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">
            ← {asText(t('management.back'), 'Назад')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">{asText(t('management.title'), 'Управление')}</h1>
              <p className="text-foreground/40 text-sm font-medium uppercase tracking-widest">
                {asText(t('management.subtitle'), 'Справочники')}
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="glass-btn bg-primary text-white border-none px-8 py-4 shadow-xl shadow-primary/20"
            >
              <Plus size={20} />
              {asText(t('management.add_new'), 'Добавить')} {activeEntityLabel}
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border font-medium ${
              message.startsWith('✅')
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl mb-8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-foreground/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {asText(tab.label, 'Раздел')}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card overflow-hidden"
          >
            {isLoading ? (
              <div className="flex justify-center p-24">
                <Loader2 className="animate-spin text-primary" size={48} />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">RU</th>
                    <th className="px-8 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">CYR</th>
                    <th className="px-8 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">LAT</th>
                    <th className="px-8 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">EN</th>
                    <th className="px-8 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/1 transition-colors group">
                      <td className="px-8 py-6 font-bold">{asText(item.name_rus, '—')}</td>
                      <td className="px-8 py-6 text-foreground/70">{asText(item.name_cyr, '—')}</td>
                      <td className="px-8 py-6 text-foreground/70">{asText(item.name_lat, '—')}</td>
                      <td className="px-8 py-6 text-foreground/70">{asText(item.name_eng, '—')}</td>
                      <td className="px-8 py-6 text-right">
                        {canManage ? (
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/50 text-foreground/40 hover:text-primary transition-all"
                              title="Редактировать"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 text-foreground/40 hover:text-red-500 transition-all disabled:opacity-50"
                              title="Удалить"
                            >
                              {deletingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/30 uppercase tracking-widest">Read only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center text-foreground/40 font-medium">
                        {asText(t('management.no_data'), 'No data available')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="glass-card max-w-xl w-full p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingItem ? 'Редактировать' : 'Добавить'} {activeEntityLabel}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-500">{asText(error, 'Ошибка')}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Название (RU) *</label>
                <input
                  type="text"
                  required
                  value={form.name_rus}
                  onChange={(event) => setForm((prev) => ({ ...prev, name_rus: event.target.value }))}
                  className="input-field"
                  placeholder="Русское название"
                />
              </div>
              <div>
                <label className="input-label">Название (CYR) *</label>
                <input
                  type="text"
                  required
                  value={form.name_cyr}
                  onChange={(event) => setForm((prev) => ({ ...prev, name_cyr: event.target.value }))}
                  className="input-field"
                  placeholder="Кириллическое название"
                />
              </div>
              <div>
                <label className="input-label">Название (LAT) *</label>
                <input
                  type="text"
                  required
                  value={form.name_lat}
                  onChange={(event) => setForm((prev) => ({ ...prev, name_lat: event.target.value }))}
                  className="input-field"
                  placeholder="Lotincha nom"
                />
              </div>
              <div>
                <label className="input-label">Название (EN) *</label>
                <input
                  type="text"
                  required
                  value={form.name_eng}
                  onChange={(event) => setForm((prev) => ({ ...prev, name_eng: event.target.value }))}
                  className="input-field"
                  placeholder="English name"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
                  {asText(t('common.cancel'), 'Отмена')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                  {editingItem ? asText(t('common.save'), 'Сохранить') : asText(t('common.add'), 'Добавить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
