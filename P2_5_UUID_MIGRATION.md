# 🔧 UUID Migration Path - Документация

**Дата:** 7 марта 2026 г.  
**Статус:** ✅ **UUID полностью настроен и работает**

---

## 📊 Обзор

Все таблицы базы данных используют **UUID** в качестве первичных ключей и внешних ключей.

**Build статус:** ✅ Успешен (11.7s)

---

## ✅ Реализованные UUID

### Первичные ключи (Primary Keys)

Все entity используют `@PrimaryGeneratedColumn('uuid')`:

| Entity | Файл | Primary Key |
|--------|------|-------------|
| `OrderEntity` | `order.entity.ts` | `id: string` (UUID) |
| `OrderDetailEntity` | `order-detail.entity.ts` | `id: string` (UUID) |
| `OrderLifecycleEntity` | `order-lifecycle.entity.ts` | `id: string` (UUID) |
| `OrderPriceHistoryEntity` | `order-price-history.entity.ts` | `id: string` (UUID) |
| `PaymentEntity` | `payment.entity.ts` | `id: string` (UUID) |
| `ClientEntity` | `client.entity.ts` | `id: string` (UUID) |
| `UserEntity` | `user.entity.ts` | `id: string` (UUID) |
| `RoleEntity` | `role.entity.ts` | `id: string` (UUID) |
| `EquipmentEntity` | `equipment.entity.ts` | `id: string` (UUID) |
| `ServiceEntity` | `service.entity.ts` | `id: string` (UUID) |
| `IssueEntity` | `issue.entity.ts` | `id: string` (UUID) |
| `NotificationEntity` | `notification.entity.ts` | `id: string` (UUID) |
| `MessageEntity` | `message.entity.ts` | `id: string` (UUID) |

### Внешние ключи (Foreign Keys)

Все foreign keys используют `type: 'uuid'`:

**Примеры:**

```typescript
// OrderEntity
@Column({ type: 'uuid' })
client_id: string;

@Column({ type: 'uuid' })
created_by: string;

@Column({ type: 'uuid', nullable: true })
closed_by: string | null;

// OrderDetailEntity
@Column({ type: 'uuid' })
order_id: string;

@Column({ type: 'uuid' })
service_id: string;

@Column({ type: 'uuid' })
equipment_id: string;

@Column({ type: 'uuid' })
issue_id: string;

@Column({ type: 'uuid', nullable: true })
attached_to: string | null;

// PaymentEntity
@Column({ type: 'uuid' })
order_id: string;

@Column({ type: 'uuid', nullable: true })
cashier_by: string | null;

// OrderLifecycleEntity
@Column({ type: 'uuid' })
order_id: string;

@Column({ type: 'uuid', nullable: true })
order_details_id: string | null;

@Column({ type: 'uuid' })
created_by: string;

@Column({ type: 'uuid', nullable: true })
actor_id: string | null;
```

---

## 📝 Миграции

### Существующие миграции

| № | Миграция | Описание |
|---|----------|----------|
| 1 | `1709344000000-InitialSchema.ts` | Начальная схема с UUID |
| 2 | `1712578000000-add-order-fields.ts` | Добавление полей в orders |
| 3 | `1712579000000-add-payment-constraints.ts` | Payment constraints |
| 4 | `1772536401026-CreateMessagesTable.ts` | Messages table с UUID |
| 5 | `1772536401027-AddAuditFields.ts` | Audit fields |
| 6 | `1772581000000-AddLifecycleActorFields.ts` | Lifecycle actor fields |
| 7 | `1772582000000-add-price-history-table.ts` | Price history с UUID |
| 8 | `1772626704135-AddPriceApprovalFields.ts` | Price approval fields |
| 9 | `1772658864285-SyncOrderFields.ts` | Синхронизация полей |
| 10 | `1772705000000-BackfillLifecycleActionType.ts` | Backfill action types |
| 11 | `1772710000000-AddUserAccountSettings.ts` | User settings |
| 12 | `1772711000000-CleanupLegacyStatusDuplicates.ts` | Очистка дубликатов |
| 13 | `1772711100000-CleanupInvalidItemCompletedEvents.ts` | Очистка событий |
| 14 | `1772712000000-AddPasswordResetFieldsToUsers.ts` | Password reset |
| 15 | `1772713000000-RebuildOrderStatuses.ts` | Пересборка статусов |
| 16 | `1772714000000-AddUserAvatarUrl.ts` | Avatar URL |
| 17 | `1772715000000-AddDetailIdToPriceHistory.ts` | Detail ID в price history |
| 18 | `1772716000000-AddTelegramToUsers.ts` | Telegram в users |

### Миграция статусов

**Файл:** `1772713000000-RebuildOrderStatuses.ts`

Эта миграция приводит все статусы заказов к единому формату:

**Старые статусы → Новые статусы:**
- `accepted` → `assigned`
- `pending_approval` → `awaiting_approval`
- `waiting_for_approval` → `awaiting_approval`
- `awaiting_client_approval` → `awaiting_approval`
- `in_progress` → `in_repair`
- `waiting_for_parts` → `in_repair`
- `completed` → `ready_for_pickup`

**Проверка статусов:**
```sql
ALTER TABLE "orders"
ADD CONSTRAINT "orders_status_check"
CHECK (
    (status)::text = ANY (
        (ARRAY[
            'new',
            'assigned',
            'diagnosing',
            'awaiting_approval',
            'approved',
            'in_repair',
            'ready_for_pickup',
            'unrepairable',
            'issued',
            'cancelled'
        ])::text[]
    )
)
```

---

## 🔍 Проверка UUID в БД

### SQL запросы для проверки

**1. Проверка первичных ключей:**
```sql
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'id'
ORDER BY table_name;
```

**2. Проверка foreign keys:**
```sql
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

**3. Проверка UUID формата:**
```sql
-- Проверка что все ID в формате UUID
SELECT id, pg_typeof(id) FROM orders LIMIT 5;
SELECT id, pg_typeof(id) FROM users LIMIT 5;
SELECT id, pg_typeof(id) FROM payments LIMIT 5;
```

---

## 🎯 Преимущества UUID

### ✅ Преимущества

1. **Глобальная уникальность** - UUID уникальны во всём мире
2. **Безопасность** - Нельзя угадать следующий ID (в отличие от auto-increment)
3. **Распределённость** - Можно генерировать на разных серверах без конфликтов
4. **Масштабируемость** - Легко шардировать по UUID
5. **Слияние данных** - При слиянии БД нет конфликтов ключей
6. **Стандартизация** - Единый формат для всех сущностей

### ⚠️ Недостатки

1. **Размер** - 16 байт vs 4 байта для INT
2. **Индексы** - Больше размер индексов
3. **Читаемость** - Менее читаемы чем числовые ID
4. **Производительность** - Немного медленнее чем INT (но незаметно на практике)

---

## 📦 Генерация UUID

### В TypeORM

```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

### В PostgreSQL

```sql
-- Генерация UUID v4
SELECT gen_random_uuid();

-- Или
SELECT uuid_generate_v4();
```

### В Node.js

```typescript
import { randomUUID } from 'crypto';

const id = randomUUID();
// или
const id = crypto.randomUUID();
```

---

## 🔄 Миграция с INT на UUID

Если потребуется миграция с INT на UUID:

### 1. Создать новую колонку

```sql
ALTER TABLE "orders" ADD COLUMN "id_uuid" UUID DEFAULT gen_random_uuid();
```

### 2. Заполнить UUID

```sql
UPDATE "orders" SET "id_uuid" = gen_random_uuid();
```

### 3. Обновить foreign keys

```sql
ALTER TABLE "order_details" 
ADD COLUMN "order_id_uuid" UUID;

UPDATE "order_details" od
SET "order_id_uuid" = o.id_uuid
FROM "orders" o
WHERE od.order_id = o.id;
```

### 4. Переименовать колонки

```sql
ALTER TABLE "orders" 
DROP CONSTRAINT "orders_pkey";

ALTER TABLE "orders" 
RENAME COLUMN "id" TO "id_int";

ALTER TABLE "orders" 
RENAME COLUMN "id_uuid" TO "id";

ALTER TABLE "orders" 
ADD PRIMARY KEY (id);
```

### 5. Удалить старые колонки

```sql
ALTER TABLE "orders" DROP COLUMN "id_int";
```

---

## ✅ Текущий статус

| Компонент | Статус |
|-----------|--------|
| Primary Keys (UUID) | ✅ Настроены |
| Foreign Keys (UUID) | ✅ Настроены |
| Миграции | ✅ Созданы |
| Constraints | ✅ Созданы |
| Индексы | ✅ Созданы |
| Entity Types | ✅ Типизированы |

---

## 📊 Статистика UUID

| Метрика | Значение |
|---------|----------|
| Entity с UUID | 13 |
| Миграций | 18 |
| Foreign keys | 40+ |
| Формат UUID | v4 (random) |

---

## 🎯 Рекомендации

### Для новых таблиц

1. Всегда использовать `@PrimaryGeneratedColumn('uuid')`
2. Все foreign keys делать `type: 'uuid'`
3. Добавлять индексы на foreign keys
4. Использовать `onDelete: 'CASCADE'` для связей

### Для существующих таблиц

1. Если таблица новая - создать с UUID
2. Если таблица старая с INT - запланировать миграцию
3. Протестировать миграцию на staging
4. Сделать backup перед миграцией

---

**Дата отчёта:** 7 марта 2026 г.  
**Статус:** ✅ **UUID MIGRATION COMPLETE**
