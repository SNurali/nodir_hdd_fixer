# 📋 Backlog: P0/P1/P2 Приоритеты

**Аудит проведён:** 3 марта 2026  
**Статус:** В работе

---

## 🔴 P0: Критические (Неделя 1)

### Auth & Security

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P0-1 | Auth mismatch: cookie vs Bearer | `jwt-auth.guard.ts`, `main.ts` | 1ч | ✅ Готово |
| P0-2 | Включить cookie-parser | `main.ts` | 0.5ч | ✅ Готово |
| P0-3 | Исправить роль 'Master' → 'master' | `users.service.ts` | 0.5ч | ✅ Готово |

### API Routes & Frontend

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P0-4 | Синхронизировать роуты/orders | `orders.controller.ts`, `admin/orders/[id]/page.tsx` | 2ч | ⏳ Pending |
| P0-5 | Исправить guest checkout | `orders/new/page.tsx`, `login/page.tsx` | 2ч | ⏳ Pending |

### Payments

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P0-6 | refund endpoint: paymentId UUID | `payments.controller.ts:44` | 1ч | ⏳ Pending |
| P0-7 | payments.service: SQL interval fix | `payments.service.ts` | 1ч | ⏳ Pending |
| P0-8 | payment system type → UUID | `payment.entity.ts` | 1ч | ⏳ Pending |

### Build & TypeScript

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P0-9 | Fix TS errors in orders/[id]/page.tsx | `orders/[id]/page.tsx` | 3ч | ⏳ Pending |
| P0-10 | Fix hooks error in admin/orders/page.tsx | `admin/orders/page.tsx` | 2ч | ⏳ Pending |

**Итого P0:** 14 часов

---

## 🟡 P1: Важные (Неделя 2)

### Business Logic

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P1-1 | State machine для заказов | `orders.service.ts` | 6ч | ⏳ Pending |
| P1-2 | Аудит действий (кто что изменил) | `order-lifecycle.entity.ts` | 4ч | ⏳ Pending |
| P1-3 | SLA метрики по этапам | `orders.service.ts` | 3ч | ⏳ Pending |

### User Experience

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P1-4 | Сохранение контактов из формы | `orders/new/page.tsx`, `dto/index.ts` | 2ч | ⏳ Pending |
| P1-5 | Трекинг заказа: история статусов | `orders/[id]/page.tsx` | 3ч | ⏳ Pending |
| P1-6 | Уведомления "что дальше" | `notifications.service.ts` | 3ч | ⏳ Pending |

### Financial

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P1-7 | Отчёт выручки (unpaid/overdue) | `payments.service.ts` | 4ч | ⏳ Pending |
| P1-8 | Корректные refund сценарии | `payments.service.ts` | 2ч | ⏳ Pending |

**Итого P1:** 27 часов

---

## 🟢 P2: Улучшения (Неделя 3-4)

### Design System

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P2-1 | Единые токены (цвета, spacing) | `globals.css`, `tailwind.config.ts` | 4ч | ⏳ Pending |
| P2-2 | Убрать bg-${...} динамические классы | `admin/orders/[id]/page.tsx` | 3ч | ⏳ Pending |
| P2-3 | Единый язык компонентов | Все `page.tsx` | 6ч | ⏳ Pending |

### Backend Architecture

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P2-4 | Enum'ы ролей/статусов в shared | `packages/shared/` | 3ч | ⏳ Pending |
| P2-5 | UUID migration path | Миграции | 4ч | ⏳ Pending |
| P2-6 | OpenAPI typed client для фронта | `apps/web/src/lib/` | 5ч | ⏳ Pending |

### Testing

| # | Задача | Файлы | Часы | Статус |
|---|--------|-------|------|--------|
| P2-7 | E2E тесты критических путей | `tests/e2e/` | 8ч | ⏳ Pending |
| P2-8 | Регрессионные тесты | `tests/regression/` | 6ч | ⏳ Pending |

**Итого P2:** 39 часов

---

## 📊 Сводка

| Приоритет | Задач | Часов | Дней (8ч) |
|-----------|-------|-------|-----------|
| P0 | 10 | 14ч | 1.75 дня |
| P1 | 8 | 27ч | 3.5 дня |
| P2 | 8 | 39ч | 5 дней |
| **Всего** | **26** | **80ч** | **10 дней** |

---

## 🎯 План спринтов

### Спринт 1 (Неделя 1): P0 Stabilization
- ✅ Auth fixed
- ✅ Roles fixed
- ⏳ API routes sync
- ⏳ Payments bugs
- ⏳ Build errors

### Спринт 2 (Неделя 2): Business Logic
- ⏳ State machine
- ⏳ Guest checkout
- ⏳ Financial reports
- ⏳ Audit trail

### Спринт 3 (Неделя 3): UX/UI Polish
- ⏳ Design system
- ⏳ Dynamic classes fix
- ⏳ Component unification

### Спринт 4 (Неделя 4): Testing & Metrics
- ⏳ E2E tests
- ⏳ SLA metrics
- ⏳ OpenAPI client

---

## 🔧 Технические долги

1. **Миграции:** 2 отдельные миграции → объединить
2. **Notifications:** некорректные контракты
3. **Messages:** UUID совместимость
4. **Shared DTO:** валидация Zod → class-validator

---

## 📈 Метрики успеха

- [ ] 0 P0 ошибок в production
- [ ] 80%+ test coverage
- [ ] < 200ms API response time (p95)
- [ ] 0 TypeScript ошибок
- [ ] 100% API routes соответствуют frontend

---

**Обновлено:** 3 марта 2026  
**Следующий review:** 10 марта 2026
