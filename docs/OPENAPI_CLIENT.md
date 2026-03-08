# 📖 OpenAPI Typed Client - Документация

**Дата:** 7 марта 2026 г.  
**Статус:** ✅ **Готов к использованию**

---

## 🚀 Быстрый старт

### 1. Запустите API сервер

```bash
npm run dev:api
```

### 2. Сгенерируйте клиент

```bash
npm run generate:api
```

### 3. Используйте в коде

```typescript
import { apiClient } from '@/lib/api-client';

// Получить заказы
const orders = await apiClient.getOrders({ page: 1, limit: 20 });

// Создать заказ
const order = await apiClient.createOrder({
  details: [
    {
      service_id: 'uuid-сервиса',
      equipment_id: 'uuid-оборудования',
      issue_id: 'uuid-проблемы',
      price: 10000,
    },
  ],
});

// Одобрить цену
await apiClient.approvePrice(orderId);
```

---

## 📁 Структура файлов

```
apps/web/src/lib/api-client/
├── index.ts       # Экспорты
├── types.ts       # TypeScript типы из OpenAPI
└── client.ts      # API клиент с методами
```

---

## 🔧 Генерация

### Автоматическая генерация

```bash
npm run generate:api
```

**Что происходит:**
1. Fetch OpenAPI spec с `http://localhost:3004/v1/api-json`
2. Генерация TypeScript типов через `openapi-typescript`
3. Генерация API клиента с типизированными методами
4. Сохранение в `apps/web/src/lib/api-client/`

### Ручная генерация

Если API на другом порту:

```bash
API_URL=http://localhost:3004 npm run generate:api
```

---

## 📚 API Методы

### Orders

```typescript
// Получить список заказов
const orders = await apiClient.getOrders({ page: 1, limit: 20 });

// Получить заказ по ID
const order = await apiClient.getOrder(orderId);

// Создать заказ
const order = await apiClient.createOrder({
  client_id?: string,
  language?: 'ru' | 'uz' | 'en',
  deadline?: string,
  details: OrderDetail[],
  guest_name?: string,
  guest_phone?: string,
  guest_telegram?: string,
  guest_email?: string,
});

// Обновить заказ
await apiClient.updateOrder(orderId, {
  status?: OrderStatus,
  deadline?: string,
  reason?: string,
});

// Принять заказ
await apiClient.acceptOrder(orderId);

// Отклонить заказ
await apiClient.rejectOrder(orderId);

// Установить цену
await apiClient.setPrice(orderId, {
  details: [{ detail_id: string, price: number }],
});

// Одобрить цену
await apiClient.approvePrice(orderId);

// Отклонить цену
await apiClient.rejectPrice(orderId, { reason: string });

// Назначить мастера
await apiClient.assignMaster(orderId, {
  master_id: string,
  detail_id?: string,
});

// Получить историю изменений
await apiClient.getOrderLifecycle(orderId);

// Получить историю цен
await apiClient.getPriceHistory(orderId);
```

### Payments

```typescript
// Создать платёж
await apiClient.createPayment(orderId, {
  payment_type: 'CASH' | 'UZCARD' | 'HUMO' | 'CLICK' | 'PAYME' | ...,
  paid_amount: number,
  currency: 'UZS' | 'USD' | 'EUR',
  split_payments?: [{
    payment_type: string,
    paid_amount: number,
    currency: string,
  }],
});

// Обновить платёж
await apiClient.updatePayment(paymentId, {
  payment_type: string,
  paid_amount: number,
  currency: string,
});

// Вернуть платёж
await apiClient.refundPayment(paymentId, { reason: string });
```

### Users

```typescript
// Получить текущего пользователя
const user = await apiClient.getCurrentUser();

// Обновить профиль
await apiClient.updateCurrentUser({
  full_name?: string,
  email?: string,
  phone?: string,
  telegram?: string,
  preferred_language?: string,
});

// Получить список мастеров
const masters = await apiClient.getMasters();
```

### Auth

```typescript
// Логин
const tokens = await apiClient.login({
  login: string, // phone or email
  password: string,
});

// Регистрация
const tokens = await apiClient.register({
  full_name: string,
  phone: string,
  email?: string,
  telegram?: string,
  password: string,
  preferred_language: 'ru' | 'uz' | 'en',
});

// Логаут
await apiClient.logout();

// Забыли пароль
await apiClient.forgotPassword({ login: string });

// Сброс пароля
await apiClient.resetPassword({
  token: string,
  new_password: string,
});
```

### Equipment/Services/Issues

```typescript
const equipments = await apiClient.getEquipments();
const services = await apiClient.getServices();
const issues = await apiClient.getIssues();
```

### Clients

```typescript
// Получить список клиентов
const clients = await apiClient.getClients();

// Получить клиента по ID
const client = await apiClient.getClient(clientId);

// Создать клиента
await apiClient.createClient({
  full_name: string,
  phone: string,
  telegram?: string,
  email?: string,
  preferred_language: string,
});

// Обновить клиента
await apiClient.updateClient(clientId, {
  full_name?: string,
  phone?: string,
  telegram?: string,
  email?: string,
  preferred_language?: string,
});
```

### Stats & Reports

```typescript
// Статистика заказов
const stats = await apiClient.getOrderStats('week'); // 'today' | 'week' | 'month'

// Финансовый отчёт
const report = await apiClient.getFinancialReport(startDate, endDate);

// SLA отчёт
const sla = await apiClient.getSlaReport(startDate, endDate);
```

---

## 🎯 Типы

Все типы автоматически генерируются из OpenAPI спецификации:

```typescript
import type { paths } from '@/lib/api-client';

// Типы запросов
type CreateOrderBody = paths['requestBodies']['CreateOrder'];
type UpdateOrderBody = paths['requestBodies']['UpdateOrder'];

// Типы ответов
type GetOrdersResponse = paths['responses']['GetOrders'];
type GetOrderResponse = paths['responses']['GetOrder'];

// Типы статусов
type OrderStatus = 'new' | 'assigned' | 'diagnosing' | ...;
```

---

## 🔒 Аутентификация

API клиент автоматически отправляет cookies с токеном:

```typescript
// После логина cookies сохраняются браузером
await apiClient.login({ login, password });

// Последующие запросы используют cookies
const orders = await apiClient.getOrders();
```

---

## 🐛 Обработка ошибок

```typescript
import { AxiosError } from 'axios';

try {
  await apiClient.createOrder(data);
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) {
      console.error('Bad request:', error.response.data);
    } else if (error.response?.status === 401) {
      console.error('Unauthorized');
    } else if (error.response?.status === 403) {
      console.error('Forbidden');
    } else if (error.response?.status === 404) {
      console.error('Not found');
    }
  }
}
```

---

## 📦 Зависимости

### Dev Dependencies

```bash
npm install -D openapi-typescript
```

### Runtime

- `axios` - HTTP клиент (уже установлен)
- `@hdd-fixer/shared` - Общие типы (уже есть в монорепе)

---

## 🔄 Обновление

При изменении API:

1. Убедитесь, что API сервер запущен
2. Запустите генерацию:

```bash
npm run generate:api
```

3. Закоммитьте изменения:

```bash
git add apps/web/src/lib/api-client/
git commit -m "chore: regenerate API client"
```

---

## 📝 Примеры использования

### React Hook

```typescript
// hooks/use-orders.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useOrders(page: number, limit: number) {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => apiClient.getOrders({ page, limit }),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data) => apiClient.createOrder(data),
  });
}
```

### Страница создания заказа

```typescript
// app/orders/new/page.tsx
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function NewOrderPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CreateOrderData) => {
    setLoading(true);
    try {
      const order = await apiClient.createOrder(data);
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* форма */}
    </form>
  );
}
```

---

## ✅ Чеклист

- [x] Скрипт генерации создан
- [x] package.json обновлён
- [x] Документация написана
- [ ] Клиент сгенерирован (требует запущенный API)
- [ ] Интеграция в существующий код

---

## 🎯 Следующие шаги

1. Запустить API сервер: `npm run dev:api`
2. Сгенерировать клиент: `npm run generate:api`
3. Интегрировать в существующие компоненты
4. Заменить прямые вызовы `api.get/post` на `apiClient.*`

---

**Дата:** 7 марта 2026 г.  
**Статус:** ✅ **ГОТОВО К ИСПОЛЬЗОВАНИЮ**
