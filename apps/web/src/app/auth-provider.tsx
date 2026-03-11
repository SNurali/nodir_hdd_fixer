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

const AUTH_STORAGE_KEY = 'auth_user';
const SESSION_MARKER_COOKIE = 'hdd_fixer_session';

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
            const saved = localStorage.getItem(AUTH_STORAGE_KEY);
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

        const clearClientAuthState = () => {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            document.cookie = `${SESSION_MARKER_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
        };

        const hasSessionMarker = document.cookie
            .split(';')
            .map((part) => part.trim())
            .some((cookie) => cookie === `${SESSION_MARKER_COOKIE}=1`);

        const hasStoredUser = !!localStorage.getItem(AUTH_STORAGE_KEY);

        if (!hasSessionMarker && !hasStoredUser) {
            setIsLoading(false);
            return () => {
                isMounted = false;
            };
        }

        const tryRefreshToken = async (): Promise<boolean> => {
            try {
                const apiBaseUrl = getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    // Store new tokens from response cookies (already set by server)
                    // Also update user in localStorage if we have fresh data
                    if (result?.user) {
                        const refreshedUser = normalizeUser(result.user);
                        if (refreshedUser) {
                            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedUser));
                        }
                    }
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        };

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
                    if (response.status === 401 || response.status === 403) {
                        // Try to refresh token before giving up
                        const refreshed = await tryRefreshToken();
                        
                        if (refreshed) {
                            // Retry fetching user profile after refresh
                            const retryResponse = await fetch(`${apiBaseUrl}/users/me`, {
                                method: 'GET',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                cache: 'no-store',
                            });

                            if (retryResponse.ok) {
                                const payload = await retryResponse.json();
                                const source = payload?.data || payload;
                                const syncedUser = normalizeUser(source);

                                if (!isMounted) return;
                                setUser(syncedUser);
                                if (syncedUser) {
                                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(syncedUser));
                                }
                                return;
                            }
                        }

                        // If refresh failed, clear auth state
                        clearClientAuthState();
                        return;
                    }
                    throw new Error('REQUEST_FAILED');
                }

                const payload = await response.json();
                const source = payload?.data || payload;
                const syncedUser = normalizeUser(source);

                if (!isMounted) return;
                setUser(syncedUser);
                if (syncedUser) {
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(syncedUser));
                } else {
                    clearClientAuthState();
                }
            } catch (error) {
                if (!isMounted) return;
                // On network errors, keep the user logged in (optimistic approach)
                // They will be logged out only when they try to perform an action
                console.warn('Auth sync failed, keeping cached user:', error);
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
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        }
        // Force reload to sync auth state with server cookies
        const dashboardPath = userData?.role === 'master' ? '/master/dashboard' : '/';
        window.location.href = dashboardPath;
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
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            document.cookie = `${SESSION_MARKER_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
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
