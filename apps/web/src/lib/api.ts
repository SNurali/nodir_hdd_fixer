import axios from 'axios';
import { toast } from 'sonner';
import { getApiBaseUrl } from './api-url';

const AUTH_REQUEST_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
]);

function isAuthRequest(url?: string): boolean {
  if (!url) return false;

  for (const path of AUTH_REQUEST_PATHS) {
    if (url.includes(path)) {
      return true;
    }
  }

  return false;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data, config } = error.response || {};
    const requestUrl = config?.url as string | undefined;

    if (status === 401 && typeof window !== 'undefined' && !isAuthRequest(requestUrl)) {
      localStorage.removeItem('auth_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      toast.error('Сеанс истек. Войдите заново');
    }

    if (status === 400) {
      let errorMessages: string[] = [];

      if (data?.errors && Array.isArray(data.errors)) {
        errorMessages = data.errors.map((err: string) => {
          if (typeof err === 'string') {
            if (err.includes('equipment_id')) return 'Выберите оборудование';
            if (err.includes('issue_id')) return 'Выберите проблему';
            if (err.includes('guest_phone') || err.includes('Invalid phone') || err.includes('international E.164')) return 'Неверный формат телефона. Укажите номер в международном формате, например +998901234567';
            if (err.includes('guest_name')) return 'Введите имя (минимум 2 символа)';
            if (err.includes('Invalid uuid')) return 'Неверные данные. Перезагрузите страницу';
            if (err.includes('required') || err.includes('client_id or guest')) return 'Заполните все обязательные поля';
          }
          return err;
        });
      } else if (data?.message) {
        const msg = data.message;
        if (typeof msg === 'string') {
          if (msg.includes('client_id or guest')) {
            errorMessages = ['Введите имя и телефон для создания заявки'];
          } else {
            errorMessages = [msg];
          }
        } else if (Array.isArray(msg)) {
          errorMessages = msg;
        }
      }

      if (errorMessages.length > 0) {
        toast.error(errorMessages.join('. '), { duration: 6000 });
      } else {
        toast.error('Ошибка валидации. Проверьте введенные данные', { duration: 5000 });
      }
    }

    if (status === 429) {
      toast.error('Слишком много запросов. Подождите минуту.', { duration: 4000 });
    }

    if (status >= 500) {
      toast.error('Сервер временно недоступен. Попробуйте позже', { duration: 6000 });
    }

    if (!status && !data?.message) {
      toast.error('Ошибка сети. Проверьте подключение', { duration: 4000 });
    }

    return Promise.reject(error);
  }
);

export default api;
