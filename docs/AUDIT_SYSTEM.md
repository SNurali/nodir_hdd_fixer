# 🔍 Audit System

**Дата:** 3 марта 2026  
**Статус:** ✅ Реализовано

---

## 🎯 Назначение

Детальное логирование всех действий с заказами для:
- **Отслеживания** кто и что изменил
- **Аудита** бизнес-процессов
- **Расследования** инцидентов
- **Метрик** производительности

---

## 📋 Архитектура

```
┌─────────────────────────────────────────────────────┐
│                 AuditService                        │
├─────────────────────────────────────────────────────┤
│  logAction()           - универсальное логирование  │
│  logStatusChange()     - изменение статуса          │
│  logPriceSet()         - установка цены             │
│  logMasterAssigned()   - назначение мастера         │
│  logPriceApproved()    - одобрение цены             │
│  logPriceRejected()    - отклонение цены            │
│  logOrderClosed()      - закрытие заказа            │
│  logDeadlineChanged()  - изменение срока            │
├─────────────────────────────────────────────────────┤
│  getOrderHistory()     - вся история заказа         │
│  getActionsByType()    - по типу действия           │
│  getLastAction()       - последнее действие         │
└─────────────────────────────────────────────────────┘
                          ↓
            ┌─────────────────────────┐
            │  order_lifecycle table  │
            │  - action_type          │
            │  - metadata (JSONB)     │
            │  - comments             │
            │  - created_by           │
            │  - created_at           │
            └─────────────────────────┘
```

---

## 💾 Структура данных

### Таблица `order_lifecycle`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | ID записи |
| `order_id` | UUID | ID заказа |
| `order_details_id` | UUID | ID детали (опционально) |
| `action_type` | VARCHAR(50) | Тип действия |
| `metadata` | JSONB | Детали действия |
| `comments` | TEXT | Комментарий |
| `is_completed` | SMALLINT | Флаг завершения |
| `created_by` | UUID | ID пользователя |
| `created_at` | TIMESTAMPTZ | Время создания |

### Metadata структура

```json
{
    "field_name": "status",
    "old_value": "new",
    "new_value": "in_progress",
    "reason": "Мастер приступил к работе",
    "detail_id": "uuid-optional",
    "master_name": "Иван Иванов",
    "currency": "UZS"
}
```

---

## 🔧 Типы действий

| Action Type | Описание | Поля metadata |
|-------------|----------|---------------|
| `status_change` | Изменение статуса | `field_name`, `old_value`, `new_value`, `reason` |
| `price_set` | Установка цены | `field_name`, `detail_id`, `old_value`, `new_value`, `currency` |
| `master_assigned` | Назначение мастера | `field_name`, `detail_id`, `old_value`, `new_value`, `master_name` |
| `price_approved` | Одобрение цены | `field_name`, `old_value`, `new_value` |
| `price_rejected` | Отклонение цены | `field_name`, `reason` |
| `order_closed` | Закрытие заказа | `field_name`, `reason` |
| `deadline_changed` | Изменение срока | `field_name`, `old_value`, `new_value` |

---

## 📖 Использование

### Backend

**AuditService:**

```typescript
import { AuditService } from './audit.service';

constructor(
    private readonly auditService: AuditService,
) {}

// Изменение статуса
await this.auditService.logStatusChange(
    orderId,
    userId,
    'new',
    'in_progress',
    'Мастер приступил к работе'
);

// Установка цены
await this.auditService.logPriceSet(
    orderId,
    userId,
    detailId,
    0,
    50000
);

// Назначение мастера
await this.auditService.logMasterAssigned(
    orderId,
    userId,
    detailId,
    null,
    masterId,
    'Иван Иванов'
);

// Получить историю
const history = await this.auditService.getOrderHistory(orderId);

// Получить по типу
const statusChanges = await this.auditService.getActionsByType(
    orderId,
    'status_change'
);

// Последнее действие
const last = await this.auditService.getLastAction(orderId);
```

---

## 🎨 Frontend Integration

**Получение истории заказа:**

```typescript
// GET /orders/:id/lifecycle
const { data: lifecycle } = useSWR(`/orders/${orderId}/lifecycle`, fetcher);

// Рендеринг timeline
<Timeline>
    {lifecycle?.map((event) => (
        <TimelineItem
            key={event.id}
            icon={getIconForAction(event.action_type)}
            title={event.comments}
            user={event.creator.full_name}
            date={new Date(event.created_at).toLocaleString()}
            metadata={event.metadata}
        />
    ))}
</Timeline>
```

**Пример UI:**

```tsx
<div className="space-y-4">
    {lifecycle.map((event) => (
        <div key={event.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {getIcon(event.action_type)}
            </div>
            <div className="flex-1">
                <p className="font-medium">{event.comments}</p>
                <p className="text-sm text-gray-500">
                    {event.creator.full_name} • {formatDate(event.created_at)}
                </p>
                {event.metadata && (
                    <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                        {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    ))}
</div>
```

---

## 📊 Примеры записей

### 1. Изменение статуса

```json
{
    "id": "uuid-1",
    "order_id": "uuid-order",
    "action_type": "status_change",
    "comments": "Статус изменён с 'new' на 'in_progress'",
    "metadata": {
        "field_name": "status",
        "old_value": "new",
        "new_value": "in_progress",
        "reason": "Мастер приступил к работе"
    },
    "creator": { "full_name": "Администратор" },
    "created_at": "2026-03-03T10:00:00Z"
}
```

### 2. Установка цены

```json
{
    "id": "uuid-2",
    "order_id": "uuid-order",
    "order_details_id": "uuid-detail",
    "action_type": "price_set",
    "comments": "Цена изменена с 0 на 50000 UZS",
    "metadata": {
        "field_name": "price",
        "detail_id": "uuid-detail",
        "old_value": 0,
        "new_value": 50000,
        "currency": "UZS"
    },
    "creator": { "full_name": "Мастер Иван" },
    "created_at": "2026-03-03T11:00:00Z"
}
```

### 3. Назначение мастера

```json
{
    "id": "uuid-3",
    "action_type": "master_assigned",
    "comments": "Мастер назначен: Иван Иванов",
    "metadata": {
        "field_name": "attached_to",
        "detail_id": "uuid-detail",
        "old_value": null,
        "new_value": "uuid-master",
        "master_name": "Иван Иванов"
    },
    "created_at": "2026-03-03T12:00:00Z"
}
```

---

## 🔍 Запросы

### Получить все изменения статуса

```sql
SELECT 
    l.created_at,
    l.comments,
    l.metadata,
    u.full_name as changed_by
FROM order_lifecycle l
JOIN users u ON l.created_by = u.id
WHERE l.order_id = 'uuid-order'
  AND l.action_type = 'status_change'
ORDER BY l.created_at ASC;
```

### Получить кто назначал мастеров

```sql
SELECT 
    l.metadata->>'master_name' as master,
    u.full_name as assigned_by,
    l.created_at
FROM order_lifecycle l
JOIN users u ON l.created_by = u.id
WHERE l.action_type = 'master_assigned';
```

### Получить все изменения цены

```sql
SELECT 
    l.metadata->>'old_value' as old_price,
    l.metadata->>'new_value' as new_price,
    l.metadata->>'currency' as currency,
    u.full_name as changed_by,
    l.created_at
FROM order_lifecycle l
JOIN users u ON l.created_by = u.id
WHERE l.action_type = 'price_set';
```

---

## 📈 Метрики и отчёты

### Время на каждом статусе

```typescript
async getStatusDuration(orderId: string) {
    const history = await this.auditService.getOrderHistory(orderId);
    const statusChanges = history.filter(h => h.action_type === 'status_change');
    
    const durations = [];
    for (let i = 0; i < statusChanges.length - 1; i++) {
        const current = statusChanges[i];
        const next = statusChanges[i + 1];
        durations.push({
            status: current.metadata.new_value,
            duration: new Date(next.created_at).getTime() - 
                      new Date(current.created_at).getTime(),
        });
    }
    return durations;
}
```

### Кто чаще всего меняет статусы

```sql
SELECT 
    u.full_name,
    COUNT(*) as status_changes
FROM order_lifecycle l
JOIN users u ON l.created_by = u.id
WHERE l.action_type = 'status_change'
GROUP BY u.id, u.full_name
ORDER BY status_changes DESC;
```

---

## 🔒 Безопасность

### Audit trail нельзя изменить

- Записи только на добавление (append-only)
- Нет endpoint'ов на изменение/удаление
- Все записи подписываются UserID

### Доступ к истории

- **Клиент**: видит историю только своих заказов
- **Мастер**: видит историю назначенных заказов
- **Admin/Operator**: полный доступ

---

## 🧪 Тестирование

```typescript
describe('AuditService', () => {
    it('should log status change', async () => {
        const entry = await auditService.logStatusChange(
            orderId,
            userId,
            'new',
            'in_progress',
            'Test reason'
        );
        
        expect(entry.action_type).toBe('status_change');
        expect(entry.metadata.old_value).toBe('new');
        expect(entry.metadata.new_value).toBe('in_progress');
    });
    
    it('should get order history', async () => {
        const history = await auditService.getOrderHistory(orderId);
        expect(history.length).toBeGreaterThan(0);
    });
});
```

---

## 📚 Связанные файлы

- [`apps/api/src/modules/orders/audit.service.ts`](../apps/api/src/modules/orders/audit.service.ts)
- [`apps/api/src/database/entities/order-lifecycle.entity.ts`](../apps/api/src/database/entities/order-lifecycle.entity.ts)
- [`apps/api/src/database/migrations/1772536401027-AddAuditFields.ts`](../apps/api/src/database/migrations/1772536401027-AddAuditFields.ts)
- [`docs/ORDER_STATE_MACHINE.md](./ORDER_STATE_MACHINE.md)

---

**Обновлено:** 3 марта 2026  
**Версия:** 1.0
