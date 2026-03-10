import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from './page';
import api from '@/lib/api';

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

const mockLogin = vi.fn();

let mockAuthState: {
  login: typeof mockLogin;
  user: { id: string; full_name: string; role: 'admin' | 'client' } | null;
  isLoading: boolean;
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('../auth-provider', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('LoginPage', () => {
  const apiPostMock = vi.mocked(api.post);

  beforeEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockLogin.mockReset();
    apiPostMock.mockReset();
    mockAuthState = {
      login: mockLogin,
      user: null,
      isLoading: false,
    };
    window.history.pushState({}, '', '/login');
  });

  it('redirects authenticated users away from login page', async () => {
    mockAuthState.user = {
      id: '1',
      full_name: 'Admin User',
      role: 'admin',
    };

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  it('submits login form and navigates to dashboard', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    await screen.findByText('login.sign_in');

    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[0], 'admin@test.uz');
    await userEvent.type(screen.getByPlaceholderText('login.password_placeholder'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /login\.sign_in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.uz', 'secret123');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('requests password reset and switches to reset mode when debug token is returned', async () => {
    apiPostMock.mockResolvedValue({
      data: {
        message: 'Reset requested',
        debug_reset_token: 'debug-token-123',
      },
    });

    render(<LoginPage />);

    await screen.findByText('login.sign_in');
    await userEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }));

    await screen.findByText('Восстановление пароля');
    await userEvent.type(screen.getByPlaceholderText('Введите номер или email'), 'client@test.uz');
    await userEvent.click(screen.getByRole('button', { name: /Отправить/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith('/auth/forgot-password', { login: 'client@test.uz' });
    });

    expect(await screen.findByText('Сброс пароля')).toBeInTheDocument();
    expect(screen.getByDisplayValue('debug-token-123')).toBeInTheDocument();
  });
});
