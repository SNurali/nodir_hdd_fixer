import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-provider';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

function Consumer() {
  const { user, login, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="user">{user?.full_name || 'none'}</div>
      <div data-testid="role">{user?.role || 'none'}</div>
      <button
        onClick={() => login('admin@test.uz', 'secret')}
        type="button"
      >
        login
      </button>
      <button
        onClick={() => logout()}
        type="button"
      >
        logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  const fetchMock = vi.fn();
  const apiPostMock = vi.mocked(api.post);

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    fetchMock.mockReset();
    apiPostMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears stale local user on unauthorized sync', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', full_name: 'Old User', role: 'client' }));
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('keeps cached user on transient sync failure', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', full_name: 'Cached User', role: 'client' }));
    fetchMock.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Cached User');
    expect(localStorage.getItem('auth_user')).toContain('Cached User');
  });

  it('normalizes role objects from cached auth state and server sync', async () => {
    localStorage.setItem('auth_user', JSON.stringify({
      id: '1',
      full_name: 'Cached User',
      role: {
        id: 'role-1',
        name_eng: 'operator',
        name_rus: 'Оператор',
      },
    }));

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        full_name: 'Synced User',
        role: {
          id: 'role-1',
          name_eng: 'admin',
          name_rus: 'Администратор',
        },
      }),
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('role')).toHaveTextContent('operator');

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('admin');
    });

    expect(localStorage.getItem('auth_user')).toContain('"role":"admin"');
  });

  it('stores user on login and clears on logout', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });
    apiPostMock.mockImplementation(async (url: string) => {
      if (url === '/auth/login') {
        return {
          data: {
            user: {
              id: '42',
              full_name: 'Admin User',
              role: 'admin',
              avatar_url: null,
            },
          },
        };
      }

      return { data: { message: 'Logged out successfully' } };
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });
    expect(localStorage.getItem('auth_user')).toContain('Admin User');

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});
