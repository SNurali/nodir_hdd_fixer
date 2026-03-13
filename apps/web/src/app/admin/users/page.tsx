"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useAppSettings } from '@/app/app-settings-provider';
import useSWR from 'swr';
import api from '@/lib/api';
import {
  Search, Plus, Edit, Trash2, User as UserIcon, Mail, Phone,
  Shield, RefreshCw, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminUsersPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const { user: currentUser, logout } = useAuth();
  const { formatDate } = useAppSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: usersData, isLoading, error: fetchError, mutate } = useSWR('/users', fetcher);
  const { data: rolesData } = useSWR('/roles', fetcher);

  const users = usersData?.data || usersData || [];
  const roles = rolesData || [];

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    return matchesSearch;
  });

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      operator: 'bg-blue-100 text-blue-700 border-blue-200',
      master: 'bg-green-100 text-green-700 border-green-200',
      client: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[roleName?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/users/${userId}/role`, { role_id: roleId });
      setSuccess(t('admin_users.role_changed_success'));
      mutate();
      setEditingUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin_users.role_changed_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole('');
    setError(null);
  };

  React.useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-red-500 text-lg mb-4">{t('admin_users.access_denied')}</p>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">← {t('admin_users.home_back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RECOVERY.UZ</h1>
              <span className="text-sm text-gray-500">{t('admin_users.admin_panel')}</span>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="text-sm border rounded-lg px-3 py-1.5 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="uz-cyr">UZ (Cyr)</option>
                <option value="uz-lat">UZ (Lot)</option>
              </select>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserIcon className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_users.total_users')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_users.administrators')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u: any) => u.role?.name_eng === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserIcon className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_users.masters')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u: any) => u.role?.name_eng === 'master').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserIcon className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_users.operators')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u: any) => u.role?.name_eng === 'operator').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <XCircle className="text-red-500" size={20} />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('admin_users.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => mutate()}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className="text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={() => router.push('/admin/users/new')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                {t('admin_users.new_user')}
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.user')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.contacts')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.role')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.language')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.registration_date')}</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin_users.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail size={14} />
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone size={14} />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-800"
                            autoFocus
                          >
                            <option value="">{t('admin_users.select_role')}</option>
                            {roles.map((role: any) => (
                              <option key={role.id} value={role.id}>
                                {t(`role.${role.name_eng}`)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoleChange(user.id, selectedRole)}
                            disabled={!selectedRole || isSaving}
                            className="p-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role?.name_eng || 'client')}`}>
                          <Shield size={12} className="mr-1" />
                          {t(`role.${user.role?.name_eng || 'client'}`)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.preferred_language?.toUpperCase() || 'RU'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUser !== user.id && (
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setSelectedRole(user.role_id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title={t('admin_users.change_role')}
                          >
                            <Shield size={18} className="text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t('admin_users.details')}
                        >
                          <Edit size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={async () => {
                              if (!confirm(t('admin_users.delete_confirm', { name: user.full_name }))) return;
                              try {
                                await api.delete(`/users/${user.id}`);
                                setSuccess(t('admin_users.user_deleted_success'));
                                mutate();
                              } catch (err: any) {
                                setError(err.response?.data?.message || t('admin_users.user_delete_error'));
                              }
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400 dark:text-gray-500">
                        <UserIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">{t('admin_users.no_users')}</p>
                        <p className="text-sm">{t('admin_users.no_users_hint')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
