"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import api from '@/lib/api';
import useSWR from 'swr';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { PhoneInput } from '@/components/phone-input';
import { toOptionalTrimmedString } from '@/lib/payload';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function NewUserPage() {
    const router = useRouter();
    const { t } = useI18n();
    const { user: currentUser } = useAuth();
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', password: '', role_id: '', preferred_language: 'ru'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const { data: rolesData } = useSWR('/roles', fetcher);
    const roles = rolesData || [];

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <p className="text-red-500">{t('admin_new_user.access_denied')}</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name || !form.password || !form.role_id) {
            setMessage(`❌ ${t('admin_new_user.required_fields')}`);
            return;
        }
        
        // Validate phone format if provided
        const phone = form.phone?.trim();
        if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
            setMessage(`❌ Телефон должен быть в международном формате (например, +998901234567)`);
            return;
        }
        
        setLoading(true);
        try {
            await api.post('/users', {
                full_name: form.full_name.trim(),
                email: toOptionalTrimmedString(form.email),
                phone: phone || undefined,
                password: form.password,
                role_id: form.role_id,
                preferred_language: form.preferred_language,
            });
            setMessage(`✅ ${t('admin_new_user.created_success')}`);
            setTimeout(() => router.push('/admin/users'), 1500);
        } catch (err: any) {
            setMessage(`❌ ${err.response?.data?.message || t('admin_new_user.create_error')}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/admin/users')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">{t('admin_new_user.title')}</h1>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border-l-4 font-medium ${message.startsWith('✅') ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 border-red-600 text-red-900 dark:bg-red-900/40 dark:text-red-100'
                        }`}>{message}</div>
                )}

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">{t('client.full_name')} *</label>
                        <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('client.email')}</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('client.phone')}</label>
                            <PhoneInput
                                value={form.phone}
                                onChange={(value) => setForm({ ...form, phone: value })}
                                name="phone"
                                wrapperClassName="rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                                buttonClassName="border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/70"
                                inputClassName="px-4 py-3 text-sm"
                                dropdownClassName="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                                searchClassName="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">{t('login.password')} *</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('admin_new_user.password_placeholder')} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('admin_users.role')} *</label>
                            <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">{t('admin_users.select_role')}</option>
                                {roles.map((r: any) => <option key={r.id} value={r.id}>{t(`role.${r.name_eng}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('admin_users.language')}</label>
                            <select value={form.preferred_language} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ru">{t('profile.language_ru')}</option>
                                <option value="uz-lat">{t('profile.language_uz_lat')}</option>
                                <option value="uz-cyr">{t('profile.language_uz_cyr')}</option>
                                <option value="en">{t('profile.language_en')}</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                        {t('admin_new_user.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
