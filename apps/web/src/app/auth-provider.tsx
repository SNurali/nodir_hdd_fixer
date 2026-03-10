"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-url';

type Role = 'admin' | 'operator' | 'master' | 'client' | null;

type ApiRole =
    | Role
    | {
        id?: string;
        name_eng?: string;
        name_rus?: string;
    }
    | null
    | undefined;

interface User {
    id: string;
    full_name: string;
    role: Role;
    avatar_url: string | null;
}

function normalizeRole(role: ApiRole): Role {
    if (!role) {
        return null;
    }

    if (typeof role === 'string') {
        return role === 'admin' || role === 'operator' || role === 'master' || role === 'client'
            ? role
            : null;
    }

    const name = role.name_eng;
    return name === 'admin' || name === 'operator' || name === 'master' || name === 'client'
        ? name
        : null;
}

function normalizeUser(source: any): User | null {
    if (!source || typeof source !== 'object') {
        return null;
    }

    return {
        id: source.id || '',
        full_name: source.full_name || '',
        role: normalizeRole(source.role),
        avatar_url: source.avatar_url || null,
    };
}

interface AuthContextType {
    user: User | null;
    role: Role;
    login: (login: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (patch: Partial<User>) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('auth_user');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return normalizeUser(parsed);
                } catch {
                    return null;
                }
            }
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const syncAuthFromServer = async () => {
            try {
                const apiBaseUrl = getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/users/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                });

                if (!response.ok) {
                    throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : 'REQUEST_FAILED');
                }

                const payload = await response.json();
                const source = payload?.data || payload;
                const syncedUser = normalizeUser(source);

                if (!isMounted) return;
                setUser(syncedUser);
                if (syncedUser) {
                    localStorage.setItem('auth_user', JSON.stringify(syncedUser));
                } else {
                    localStorage.removeItem('auth_user');
                }
            } catch (error) {
                if (!isMounted) return;

                if (
                    error instanceof Error &&
                    error.message === 'UNAUTHORIZED'
                ) {
                    setUser(null);
                    localStorage.removeItem('auth_user');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        syncAuthFromServer();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (login: string, password: string) => {
        const { data } = await api.post('/auth/login', { login, password });
        const userData = normalizeUser(data.user);
        setUser(userData);
        if (userData) {
            localStorage.setItem('auth_user', JSON.stringify(userData));
        }
    };

    const updateUser = (patch: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return prev;
            const next = {
                ...prev,
                ...patch,
                role: patch.role === undefined ? prev.role : normalizeRole(patch.role as ApiRole),
                avatar_url: patch.avatar_url === undefined ? prev.avatar_url : patch.avatar_url,
            };
            localStorage.setItem('auth_user', JSON.stringify(next));
            return next;
        });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
            localStorage.removeItem('auth_user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, role: user?.role || null, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
