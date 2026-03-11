"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import { PhoneInput } from '@/components/phone-input';
import { toOptionalTrimmedString } from '@/lib/payload';
import {
  ArrowLeft, User as UserIcon, Mail, Shield, Save, X,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { t, language } = useI18n();
  const { user: currentUser, logout } = useAuth();
  const { formatDate } = useAppSettings();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role_id: '',
    preferred_language: 'ru',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: userData, isLoading, error: fetchError, mutate } = useSWR(
    userId ? `/users/${userId}` : null,
    fetcher
  );
  const { data: rolesData } = useSWR('/roles', fetcher);

  const user = userData?.data || userData;
  const roles = rolesData || [];

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id || '',
        preferred_language: user.preferred_language || 'ru',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.patch(`/users/${userId}`, {
        full_name: formData.full_name.trim(),
        email: toOptionalTrimmedString(formData.email),
        phone: toOptionalTrimmedString(formData.phone),
        preferred_language: formData.preferred_language,
      });
      setSuccess(t('admin_user_detail.user_updated_success'));
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin_user_detail.user_updated_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (roleId: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/users/${userId}/role`, { role_id: roleId });
      setSuccess(t('admin_user_detail.role_changed_success'));
      mutate();
      setFormData({ ...formData, role_id: roleId });
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin_user_detail.role_changed_error'));
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('common.users')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.full_name}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.full_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.role?.name_eng === 'admin' 
                    ? 'bg-red-100 text-red-700' 
                    : user?.role?.name_eng === 'operator'
                      ? 'bg-blue-100 text-blue-700'
                      : user?.role?.name_eng === 'master'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                }`}>
                  <Shield size={12} className="mr-1" />
                  {user?.role?.name_rus || user?.role?.name_eng}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('client.full_name')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('client.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('client.phone')}
              </label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                name="phone"
                wrapperClassName="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                buttonClassName="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/70"
                inputClassName="px-4 py-2.5"
                dropdownClassName="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                searchClassName="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin_user_detail.role_label')}
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={formData.role_id}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 appearance-none"
                >
                  <option value="">{t('admin_user_detail.select_role')}</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name_rus} ({role.name_eng})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('admin_user_detail.click_change_role')}
              </p>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('client.preferred_language')}
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              >
                <option value="ru">{t('profile.language_ru')}</option>
                <option value="en">{t('profile.language_en')}</option>
                <option value="uz-lat">{t('profile.language_uz_lat')}</option>
                <option value="uz-cyr">{t('profile.language_uz_cyr')}</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={20} />
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>

        {/* User Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('admin_user_detail.information')}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">ID:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {user?.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('admin_user_detail.registration_date')}:</span>
              <span className="text-gray-900 dark:text-white">
                {user?.created_at ? formatDate(user.created_at) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('admin_user_detail.last_update')}:</span>
              <span className="text-gray-900 dark:text-white">
                {user?.updated_at ? formatDate(user.updated_at) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
