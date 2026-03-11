"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { PhoneInput } from '@/components/phone-input';
import { toOptionalTrimmedString } from '@/lib/payload';
import {
    ChevronLeft, Plus, Search, User, Phone, Mail, Globe,
    ExternalLink, Loader2, Edit3, Trash2, Save, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ClientsPage() {
    const { t, language } = useI18n();
    const { user, isLoading: authLoading } = useAuth();
    const { formatDate } = useAppSettings();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '', telegram: '', preferred_language: 'ru' });
    const [newClient, setNewClient] = useState({
        full_name: '', phone: '', email: '', telegram: '', preferred_language: 'ru'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const { data: clients, isLoading, mutate } = useSWR(
        searchQuery ? `/clients/search?q=${searchQuery}` : '/clients',
        fetcher
    );

    if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">Доступ запрешён</p>
                    <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">← Назад</button>
                </div>
            </div>
        );
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/clients', {
                full_name: newClient.full_name.trim(),
                phone: newClient.phone.trim(),
                email: toOptionalTrimmedString(newClient.email),
                telegram: toOptionalTrimmedString(newClient.telegram),
                preferred_language: newClient.preferred_language,
            });
            setShowAddModal(false);
            setNewClient({ full_name: '', phone: '', email: '', telegram: '', preferred_language: 'ru' });
            mutate();
            setMessage('✅ Клиент добавлен');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при добавлении клиента');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClient = (client: any) => {
        setEditingClient(client.id);
        setEditForm({
            full_name: client.full_name || '',
            phone: client.phone || '',
            email: client.email || '',
            telegram: client.telegram || '',
            preferred_language: client.preferred_language || 'ru',
        });
    };

    const handleSaveEdit = async (clientId: string) => {
        setLoading(true);
        try {
            await api.patch(`/clients/${clientId}`, {
                full_name: editForm.full_name.trim(),
                phone: toOptionalTrimmedString(editForm.phone),
                email: toOptionalTrimmedString(editForm.email),
                telegram: toOptionalTrimmedString(editForm.telegram),
                preferred_language: editForm.preferred_language,
            });
            setEditingClient(null);
            mutate();
            setMessage('✅ Клиент обновлён');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage('❌ ' + (err.response?.data?.message || 'Ошибка при обновлении'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (clientId: string, clientName: string) => {
        if (!confirm(`Удалить клиента "${clientName}"? Это действие нельзя отменить.`)) return;
        try {
            await api.delete(`/clients/${clientId}`);
            mutate();
            setMessage('✅ Клиент удалён');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage('❌ ' + (err.response?.data?.message || 'Ошибка при удалении'));
        }
    };

    if (authLoading || !user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/')} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{t('clients.title')}</h1>
                            <p className="text-foreground/40 text-sm font-medium uppercase tracking-widest">{t('clients.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                            <input
                                type="text"
                                placeholder={t('clients.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="glass-btn bg-primary text-white border-none px-6 shadow-lg shadow-primary/20">
                            <Plus size={20} />
                            <span className="hidden sm:inline">{t('clients.add_client')}</span>
                        </button>
                    </div>
                </div>

                {/* Status message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border font-medium ${message.startsWith('✅') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Clients Grid */}
                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-primary" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients?.data?.map((client: any) => (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-8 group hover:bg-white/5 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />

                                {editingClient === client.id ? (
                                    /* Edit mode */
                                    <div className="space-y-3">
                                        <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm" placeholder="ФИО" />
                                        <PhoneInput
                                            value={editForm.phone}
                                            onChange={(value) => setEditForm({ ...editForm, phone: value })}
                                            name="phone"
                                            showCountryName={false}
                                            wrapperClassName="rounded-lg border border-white/20 bg-white/10"
                                            buttonClassName="min-w-[96px] border-white/10 bg-white/5"
                                            inputClassName="px-3 py-2 text-sm text-white placeholder:text-white/40"
                                            dropdownClassName="border-white/10 bg-[#0f1117]"
                                            searchClassName="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                        />
                                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm" placeholder="Email" />
                                        <input type="text" value={editForm.telegram} onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm" placeholder="Telegram" />
                                        <select value={editForm.preferred_language} onChange={(e) => setEditForm({ ...editForm, preferred_language: e.target.value })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm">
                                            <option value="ru" className="bg-gray-900">Русский</option>
                                            <option value="uz-lat" className="bg-gray-900">O'zbekcha</option>
                                            <option value="uz-cyr" className="bg-gray-900">Ўзбекча</option>
                                            <option value="en" className="bg-gray-900">English</option>
                                        </select>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => handleSaveEdit(client.id)} disabled={loading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-1">
                                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Сохранить
                                            </button>
                                            <button onClick={() => setEditingClient(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-1">
                                                <X size={14} /> Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View mode */
                                    <>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-primary group-hover:scale-110 transition-transform">
                                                {client.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditClient(client)} className="p-2 text-foreground/20 hover:text-blue-400 transition-colors" title="Редактировать">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteClient(client.id, client.full_name)} className="p-2 text-foreground/20 hover:text-red-400 transition-colors" title="Удалить">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold mb-4">{client.full_name}</h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-foreground/60">
                                                <Phone size={16} className="text-primary" /> {client.phone}
                                            </div>
                                            {client.email && (
                                                <div className="flex items-center gap-3 text-sm text-foreground/60">
                                                    <Mail size={16} className="text-primary" /> {client.email}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-sm text-foreground/60">
                                                <Globe size={16} className="text-primary" /> {client.preferred_language?.toUpperCase() || 'RU'}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Заказов</p>
                                                <p className="font-bold">{client.orders_count || 0}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Потрачено</p>
                                                <p className="font-bold text-primary">{formatMoney(client.total_spent || 0, language)}</p>
                                            </div>
                                        </div>
                                        {client.created_at && (
                                            <div className="mt-4 text-xs text-foreground/40">
                                                Создан: {formatDate(client.created_at)}
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add Client Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <div className="glass-card max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold mb-6">{t('clients.add_client')}</h2>
                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}
                            <form onSubmit={handleAddClient} className="space-y-4">
                                <div>
                                    <label className="input-label">ФИО *</label>
                                    <input type="text" required value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} className="input-field" placeholder="Иванов Иван" />
                                </div>
                                <div>
                                    <label className="input-label">Телефон *</label>
                                    <PhoneInput
                                        value={newClient.phone}
                                        onChange={(value) => setNewClient({ ...newClient, phone: value })}
                                        name="phone"
                                        required
                                        wrapperClassName="input-field overflow-hidden p-0"
                                        buttonClassName="border-white/10 bg-white/5"
                                        inputClassName="input-field rounded-none border-0 bg-transparent px-4 py-0 shadow-none ring-0"
                                        dropdownClassName="border-white/10 bg-[#0f1117]"
                                        searchClassName="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Email</label>
                                    <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="input-field" placeholder="example@mail.ru" />
                                </div>
                                <div>
                                    <label className="input-label">Telegram</label>
                                    <input type="text" value={newClient.telegram} onChange={(e) => setNewClient({ ...newClient, telegram: e.target.value })} className="input-field" placeholder="@username" />
                                </div>
                                <div>
                                    <label className="input-label">Язык</label>
                                    <select value={newClient.preferred_language} onChange={(e) => setNewClient({ ...newClient, preferred_language: e.target.value })} className="input-field">
                                        <option value="ru">Русский</option>
                                        <option value="uz-lat">O'zbekcha</option>
                                        <option value="uz-cyr">Ўзбекча</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">{t('common.cancel')}</button>
                                    <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} />{t('common.add')}</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
