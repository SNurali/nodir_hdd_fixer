"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import { useI18n } from '@/i18n/provider';
import api from '@/lib/api';
import { getPublicApiUrl } from '@/lib/api-url';
import { PhoneInput } from '@/components/phone-input';
import { PhoneBadge } from '@/components/phone-display';
import { AvatarCropper } from '@/components/avatar-cropper';
import { toOptionalTrimmedString } from '@/lib/payload';
import useSWR from 'swr';
import {
    ArrowLeft, User, Lock, Save, Loader2, CheckCircle2, XCircle, Mail, Phone, Settings2, Upload, Send
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

type AppRole = 'admin' | 'operator' | 'master' | 'client';

type SettingsForm = {
    preferred_language: 'ru' | 'en' | 'uz-cyr' | 'uz-lat';
    notifications: {
        email: boolean;
        sms: boolean;
        telegram: boolean;
        push: boolean;
    };
    ui: {
        compact_mode: boolean;
        timezone: string;
        date_format: 'dd.mm.yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    };
    role_preferences: Record<string, boolean | number | string>;
};

const DEFAULT_ROLE_PREFS: Record<AppRole, Record<string, boolean | number | string>> = {
    admin: {
        dashboard_period: 'week',
        show_finance_widgets: true,
        require_status_comment: false,
    },
    operator: {
        queue_sort: 'new_first',
        auto_refresh_seconds: 60,
        sound_notifications: true,
    },
    master: {
        show_completed_jobs: false,
        daily_job_target: 5,
        auto_open_next_assignment: true,
    },
    client: {
        marketing_notifications: false,
        auto_open_tracking_after_create: true,
        show_prices_in_usd: false,
    },
};

function buildInitialSettings(role: AppRole, data?: Partial<SettingsForm>): SettingsForm {
    return {
        preferred_language: (data?.preferred_language || 'ru') as SettingsForm['preferred_language'],
        notifications: {
            email: true,
            sms: false,
            telegram: true,
            push: true,
            ...(data?.notifications || {}),
        },
        ui: {
            compact_mode: false,
            timezone: 'Asia/Tashkent',
            date_format: 'dd.mm.yyyy',
            ...(data?.ui || {}),
        },
        role_preferences: {
            ...DEFAULT_ROLE_PREFS[role],
            ...(data?.role_preferences || {}),
        },
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading, updateUser } = useAuth();
    const { setUiSettings } = useAppSettings();
    const { t, setLanguage, language } = useI18n();
    const [message, setMessage] = useState('');
    const [profileForm, setProfileForm] = useState({ 
        full_name: '', 
        email: '', 
        phone: '', 
        telegram: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        date_of_birth: '',
    });
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null);
    const [settingsForm, setSettingsForm] = useState<SettingsForm>(buildInitialSettings('client'));
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const { data: profileData, mutate } = useSWR(user ? '/users/me' : null, fetcher);
    const { data: settingsData, mutate: mutateSettings } = useSWR(user ? '/users/me/settings' : null, fetcher);

    const profile = profileData?.data || profileData;
    const role = ((settingsData?.role || user?.role || 'client') as AppRole);
    const roleLabel = t(`role.${role}`);
    const rawAvatar = profile?.avatar_url || user?.avatar_url;
    const avatarSrc = rawAvatar
        ? (String(rawAvatar).startsWith('http') ? String(rawAvatar) : `${getPublicApiUrl()}${rawAvatar}`)
        : null;

    useEffect(() => {
        if (profile) {
            setProfileForm({
                full_name: profile.full_name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                telegram: profile.telegram || '',
                gender: profile.gender || '',
                date_of_birth: profile.date_of_birth ? String(profile.date_of_birth).split('T')[0] : '',
            });
        }
    }, [profile]);

    useEffect(() => {
        if (settingsData?.settings && role) {
            setSettingsForm(buildInitialSettings(role, settingsData.settings));
        }
    }, [settingsData, role]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await api.patch('/users/me', {
                full_name: profileForm.full_name.trim(),
                email: toOptionalTrimmedString(profileForm.email),
                phone: toOptionalTrimmedString(profileForm.phone),
                telegram: toOptionalTrimmedString(profileForm.telegram),
                gender: profileForm.gender || null,
                date_of_birth: profileForm.date_of_birth || null,
            });
            setMessage(`✅ ${t('profile.messages.profile_updated')}`);
            updateUser({ full_name: profileForm.full_name });
            mutate();
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage(`❌ ${err.response?.data?.message || t('profile.messages.profile_update_error')}`);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSelectAvatar = () => {
        if (!selectedAvatarFile) {
            setMessage(`❌ ${t('profile.messages.select_avatar')}`);
            return;
        }
        // Show cropper instead of uploading immediately
        setShowCropper(true);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCroppedAvatarBlob(croppedBlob);
        setShowCropper(false);
        
        // Upload the cropped avatar
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', croppedBlob, 'avatar.png');
            
            const { data } = await api.patch('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const nextProfile = data?.data || data;
            const newAvatarUrl = nextProfile?.avatar_url || null;
            
            // Update both user context and local state
            updateUser({
                full_name: nextProfile?.full_name || user?.full_name || '',
                avatar_url: newAvatarUrl,
            });
            await mutate();
            
            // Clear states
            setSelectedAvatarFile(null);
            setCroppedAvatarBlob(null);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
            setMessage(`✅ ${t('profile.messages.avatar_updated')}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage(`❌ ${err.response?.data?.message || t('profile.messages.avatar_update_error')}`);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUploadAvatar = async () => {
        // This function is now called after cropping
        // The actual upload happens in handleCropComplete
    };

    const handleChangePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setMessage(`❌ ${t('profile.messages.password_mismatch')}`);
            return;
        }
        if (passwordForm.new_password.length < 6) {
            setMessage(`❌ ${t('profile.messages.password_too_short')}`);
            return;
        }
        setSavingPassword(true);
        try {
            await api.patch('/users/me/password', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            setMessage(`✅ ${t('profile.messages.password_updated')}`);
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage(`❌ ${err.response?.data?.message || t('profile.messages.password_update_error')}`);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.patch('/users/me/settings', settingsForm);
            await mutateSettings();

            if (settingsForm.preferred_language !== language) {
                setLanguage(settingsForm.preferred_language as any);
            }

            setUiSettings({
                compact_mode: settingsForm.ui.compact_mode,
                timezone: settingsForm.ui.timezone,
                date_format: settingsForm.ui.date_format,
            });

            setMessage(`✅ ${t('profile.messages.settings_updated')}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage(`❌ ${err.response?.data?.message || t('profile.messages.settings_update_error')}`);
        } finally {
            setSavingSettings(false);
        }
    };

    const setRolePref = (key: string, value: boolean | number | string) => {
        setSettingsForm((prev) => ({
            ...prev,
            role_preferences: {
                ...prev.role_preferences,
                [key]: value,
            },
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
                        <p className="text-gray-500 mt-1">{t('profile.subtitle')}</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border-l-4 font-medium flex items-center gap-3 ${message.startsWith('✅')
                        ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : 'bg-red-100 border-red-600 text-red-900 dark:bg-red-900/40 dark:text-red-100'
                        }`}>
                        {message.startsWith('✅') ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        {message.replace(/^[❌✅]\s*/, '')}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={user.full_name}
                                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {user.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{user.full_name}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-sm text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                                    {roleLabel}
                                </span>
                                {profile?.phone && <PhoneBadge phone={profile.phone} />}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                        <label className="block text-sm font-medium text-gray-600 mb-2">{t('profile.avatar_label')}</label>
                        <div className="flex flex-col md:flex-row gap-3 md:items-center">
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedAvatarFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 transition-colors"
                            >
                                {t('profile.choose_file')}
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 min-w-0 truncate">
                                {selectedAvatarFile?.name || t('profile.no_file_selected')}
                            </p>
                            <button
                                onClick={handleSelectAvatar}
                                disabled={uploadingAvatar || !selectedAvatarFile}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {uploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                Обрезать и загрузить
                            </button>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-500" />
                        {t('profile.personal_data')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('client.full_name')}</label>
                            <input
                                type="text"
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    <Mail size={14} className="inline mr-1" />{t('client.email')}
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    <Phone size={14} className="inline mr-1" />{t('client.phone')}
                                </label>
                                <PhoneInput
                                    value={profileForm.phone}
                                    onChange={(value) => setProfileForm({ ...profileForm, phone: value })}
                                    name="phone"
                                    wrapperClassName="rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                                    buttonClassName="border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/70"
                                    inputClassName="px-4 py-3"
                                    dropdownClassName="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                                    searchClassName="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    <Send size={14} className="inline mr-1" />{t('client.telegram')}
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.telegram}
                                    onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('profile.telegram_placeholder')}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    {t('profile.gender')}
                                </label>
                                <select
                                    value={profileForm.gender}
                                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as 'male' | 'female' | 'other' })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('profile.gender_not_specified')}</option>
                                    <option value="male">{t('profile.gender_male')}</option>
                                    <option value="female">{t('profile.gender_female')}</option>
                                    <option value="other">{t('profile.gender_other')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    {t('profile.date_of_birth')}
                                </label>
                                <input
                                    type="date"
                                    value={profileForm.date_of_birth}
                                    onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            {savingProfile ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {t('profile.save_profile')}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Settings2 size={20} className="text-indigo-500" />
                        {t('profile.account_settings', { role: roleLabel })}
                    </h3>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.interface_language')}</label>
                                <select
                                    value={settingsForm.preferred_language}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        preferred_language: e.target.value as SettingsForm['preferred_language'],
                                    })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <option value="ru">{t('profile.language_ru')}</option>
                                    <option value="en">{t('profile.language_en')}</option>
                                    <option value="uz-lat">{t('profile.language_uz_lat')}</option>
                                    <option value="uz-cyr">{t('profile.language_uz_cyr')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.date_format')}</label>
                                <select
                                    value={settingsForm.ui.date_format}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        ui: { ...settingsForm.ui, date_format: e.target.value as SettingsForm['ui']['date_format'] },
                                    })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <option value="dd.mm.yyyy">DD.MM.YYYY</option>
                                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notifications.email}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        notifications: { ...settingsForm.notifications, email: e.target.checked },
                                    })}
                                />
                                {t('profile.notifications_email')}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notifications.sms}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        notifications: { ...settingsForm.notifications, sms: e.target.checked },
                                    })}
                                />
                                {t('profile.notifications_sms')}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notifications.telegram}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        notifications: { ...settingsForm.notifications, telegram: e.target.checked },
                                    })}
                                />
                                {t('profile.notifications_telegram')}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notifications.push}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        notifications: { ...settingsForm.notifications, push: e.target.checked },
                                    })}
                                />
                                {t('profile.notifications_push')}
                            </label>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={settingsForm.ui.compact_mode}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    ui: { ...settingsForm.ui, compact_mode: e.target.checked },
                                })}
                            />
                            {t('profile.compact_mode')}
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.timezone')}</label>
                            <input
                                type="text"
                                value={settingsForm.ui.timezone}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    ui: { ...settingsForm.ui, timezone: e.target.value },
                                })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                placeholder={t('profile.timezone_placeholder')}
                            />
                        </div>

                        {role === 'admin' && (
                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold">{t('profile.admin_settings')}</p>
                                <select
                                    value={String(settingsForm.role_preferences.dashboard_period || 'week')}
                                    onChange={(e) => setRolePref('dashboard_period', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <option value="today">{t('profile.period_today')}</option>
                                    <option value="week">{t('profile.period_week')}</option>
                                    <option value="month">{t('profile.period_month')}</option>
                                </select>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.show_finance_widgets)}
                                        onChange={(e) => setRolePref('show_finance_widgets', e.target.checked)}
                                    />
                                    {t('profile.show_finance_widgets')}
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.require_status_comment)}
                                        onChange={(e) => setRolePref('require_status_comment', e.target.checked)}
                                    />
                                    {t('profile.require_status_comment')}
                                </label>
                            </div>
                        )}

                        {role === 'operator' && (
                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold">{t('profile.operator_settings')}</p>
                                <select
                                    value={String(settingsForm.role_preferences.queue_sort || 'new_first')}
                                    onChange={(e) => setRolePref('queue_sort', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <option value="new_first">{t('profile.queue_new_first')}</option>
                                    <option value="deadline_first">{t('profile.queue_deadline_first')}</option>
                                    <option value="priority_first">{t('profile.queue_priority_first')}</option>
                                </select>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.auto_refresh_seconds')}</label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={300}
                                        value={Number(settingsForm.role_preferences.auto_refresh_seconds || 60)}
                                        onChange={(e) => setRolePref('auto_refresh_seconds', Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.sound_notifications)}
                                        onChange={(e) => setRolePref('sound_notifications', e.target.checked)}
                                    />
                                    {t('profile.sound_notifications')}
                                </label>
                            </div>
                        )}

                        {role === 'master' && (
                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold">{t('profile.master_settings')}</p>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.show_completed_jobs)}
                                        onChange={(e) => setRolePref('show_completed_jobs', e.target.checked)}
                                    />
                                    {t('profile.show_completed_jobs')}
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.daily_job_target')}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={Number(settingsForm.role_preferences.daily_job_target || 5)}
                                        onChange={(e) => setRolePref('daily_job_target', Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.auto_open_next_assignment)}
                                        onChange={(e) => setRolePref('auto_open_next_assignment', e.target.checked)}
                                    />
                                    {t('profile.auto_open_next_assignment')}
                                </label>
                            </div>
                        )}

                        {role === 'client' && (
                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold">{t('profile.client_settings')}</p>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.marketing_notifications)}
                                        onChange={(e) => setRolePref('marketing_notifications', e.target.checked)}
                                    />
                                    {t('profile.marketing_notifications')}
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.auto_open_tracking_after_create)}
                                        onChange={(e) => setRolePref('auto_open_tracking_after_create', e.target.checked)}
                                    />
                                    {t('profile.auto_open_tracking_after_create')}
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(settingsForm.role_preferences.show_prices_in_usd)}
                                        onChange={(e) => setRolePref('show_prices_in_usd', e.target.checked)}
                                    />
                                    {t('profile.show_prices_in_usd')}
                                </label>
                            </div>
                        )}

                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            {savingSettings ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {t('profile.save_settings')}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-orange-500" />
                        {t('profile.change_password')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.current_password')}</label>
                            <input
                                type="password"
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder={t('profile.password_placeholder')}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.new_password')}</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder={t('profile.new_password_placeholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">{t('profile.confirm_password')}</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder={t('profile.confirm_password_placeholder')}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleChangePassword}
                            disabled={savingPassword || !passwordForm.current_password || !passwordForm.new_password}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            {savingPassword ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                            {t('profile.update_password')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Avatar Cropper Modal */}
            {showCropper && selectedAvatarFile && (
                <AvatarCropper
                    image={selectedAvatarFile}
                    onCropComplete={handleCropComplete}
                    onClose={() => {
                        setShowCropper(false);
                        setSelectedAvatarFile(null);
                        if (avatarInputRef.current) {
                            avatarInputRef.current.value = '';
                        }
                    }}
                />
            )}
        </div>
    );
}
