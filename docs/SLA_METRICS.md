# 📊 SLA Metrics & Reporting

**Дата:** 3 марта 2026  
**Статус:** ✅ Реализовано

---

## 🎯 Назначение

SLA (Service Level Agreement) метрики для отслеживания:
- **Времени** на каждом статусе
- **Просроченных** заказов
- **Среднего** времени выполнения
- **Эффективности** мастеров

---

## 📋 API Endpoints

### 1. Get SLA Metrics

**Endpoint:** `GET /orders/stats/sla`

**Permissions:** Admin, Operator

**Query Parameters:**
- `startDate` (optional) - начало периода (ISO 8601)
- `endDate` (optional) - конец периода (ISO 8601)

**Response:**
```json
{
    "average_time_in_status": {
        "new": 7200000,
        "accepted": 3600000,
        "in_progress": 86400000,
        "completed": 14400000
    },
    "total_orders": 150,
    "completed_orders": 120,
    "overdue_orders": 5,
    "on_time_percentage": 96.67,
    "by_status": [
        {
            "status": "new",
            "count": 150,
            "average_duration_ms": 7200000,
            "average_duration_formatted": "2ч 0м"
        },
        {
            "status": "in_progress",
            "count": 140,
            "average_duration_ms": 86400000,
            "average_duration_formatted": "1д 0ч"
        }
    ]
}
```

---

### 2. Get Overdue Orders

**Endpoint:** `GET /orders/stats/overdue`

**Permissions:** Admin, Operator

**Response:**
```json
[
    {
        "id": "uuid-1",
        "status": "in_progress",
        "deadline": "2026-03-01T23:59:59Z",
        "client": { "full_name": "Клиент 1" },
        "details": [...],
        "days_overdue": 2
    },
    {
        "id": "uuid-2",
        "status": "completed",
        "deadline": "2026-03-02T23:59:59Z",
        "client": { "full_name": "Клиент 2" },
        "details": [...],
        "days_overdue": 1
    }
]
```

---

### 3. Get Near Deadline Orders

**Endpoint:** `GET /orders/stats/near-deadline?hours=24`

**Permissions:** Admin, Operator

**Query Parameters:**
- `hours` (optional, default: 24) - период в часах

**Response:**
```json
[
    {
        "id": "uuid-3",
        "status": "in_progress",
        "deadline": "2026-03-04T10:00:00Z",
        "client": { "full_name": "Клиент 3" },
        "hours_remaining": 14
    }
]
```

---

### 4. Get Order Timeline

**Endpoint:** `GET /orders/:id/timeline`

**Permissions:** All authenticated users

**Response:**
```json
{
    "order_id": "uuid-order",
    "timeline": [
        {
            "status": "new",
            "entered_at": "2026-03-01T08:00:00Z",
            "exited_at": "2026-03-01T10:00:00Z",
            "duration_ms": 7200000,
            "duration_formatted": "2ч 0м"
        },
        {
            "status": "accepted",
            "entered_at": "2026-03-01T10:00:00Z",
            "exited_at": "2026-03-01T11:00:00Z",
            "duration_ms": 3600000,
            "duration_formatted": "1ч 0м"
        },
        {
            "status": "in_progress",
            "entered_at": "2026-03-01T11:00:00Z",
            "exited_at": null,
            "duration_ms": null,
            "duration_formatted": "в процессе"
        }
    ],
    "total_duration_ms": 10800000,
    "is_overdue": false
}
```

---

### 5. Get Average Completion Time

**Endpoint:** `GET /orders/stats/average-completion`

**Permissions:** Admin, Operator

**Response:**
```json
{
    "average_ms": 172800000,
    "average_formatted": "2д 0ч",
    "total_completed": 120
}
```

---

### 6. Get SLA Report

**Endpoint:** `GET /orders/stats/report?groupBy=day&days=30`

**Permissions:** Admin, Operator

**Query Parameters:**
- `groupBy` (optional) - `day`, `week`, `month`
- `days` (optional, default: 30) - количество дней

**Response:**
```json
[
    {
        "date": "2026-02-02",
        "total_orders": 5,
        "completed_orders": 4,
        "overdue_orders": 0,
        "on_time_percentage": 100
    },
    {
        "date": "2026-02-03",
        "total_orders": 7,
        "completed_orders": 5,
        "overdue_orders": 1,
        "on_time_percentage": 85.71
    }
]
```

---

## 💾 Формулы расчёта

### Время в статусе

```typescript
duration_ms = exit_time - entry_time
```

Для текущего статуса:
```typescript
duration_ms = null (в процессе)
```

### Среднее время в статусе

```typescript
average_time[status] = sum(durations[status]) / count(durations[status])
```

### On-time percentage

```typescript
on_time_percentage = ((total_orders - overdue_orders) / total_orders) * 100
```

### Overdue заказ

```typescript
is_overdue = (deadline < now) AND (status != 'issued')
```

---

## 📊 Примеры использования

### Frontend Dashboard

```typescript
// SLA Metrics
const { data: sla } = useSWR('/orders/stats/sla', fetcher);

// Overdue orders
const { data: overdue } = useSWR('/orders/stats/overdue', fetcher);

// Timeline для конкретного заказа
const { data: timeline } = useSWR(`/orders/${orderId}/timeline`, fetcher);
```

### UI Components

```tsx
// SLA Dashboard
<div className="grid grid-cols-4 gap-4">
    <StatCard 
        title="Всего заказов" 
        value={sla.total_orders} 
    />
    <StatCard 
        title="Завершено" 
        value={sla.completed_orders}
        color="green"
    />
    <StatCard 
        title="Просрочено" 
        value={sla.overdue_orders}
        color="red"
    />
    <StatCard 
        title="On-time %" 
        value={`${sla.on_time_percentage.toFixed(1)}%`}
        color="blue"
    />
</div>

// Timeline
<Timeline>
    {timeline.timeline.map((entry) => (
        <TimelineItem
            key={entry.status}
            status={entry.status}
            duration={entry.duration_formatted}
            date={formatDate(entry.entered_at)}
        />
    ))}
</Timeline>

// Overdue Alert
{overdue.length > 0 && (
    <Alert variant="error">
        <h3>⚠️ {overdue.length} просроченных заказов</h3>
        <ul>
            {overdue.map(order => (
                <li key={order.id}>
                    #{order.id.slice(0,8)} - {order.client.full_name}
                </li>
            ))}
        </ul>
    </Alert>
)}
```

---

## 📈 Метрики

### Status Duration Metrics

| Статус | Среднее время | Цель | Статус |
|--------|---------------|------|--------|
| `new` | 2ч | < 4ч | ✅ |
| `accepted` | 1ч | < 2ч | ✅ |
| `in_progress` | 24ч | < 48ч | ✅ |
| `waiting_for_parts` | 48ч | < 72ч | ⚠️ |
| `completed` | 4ч | < 8ч | ✅ |

### SLA Targets

| Метрика | Цель | Факт | Статус |
|---------|------|------|--------|
| On-time % | > 95% | 96.67% | ✅ |
| Avg completion | < 3 days | 2 days | ✅ |
| Overdue count | < 5 | 5 | ⚠️ |

---

## 🔧 Backend Implementation

### SlaService

```typescript
@Injectable()
export class SlaService {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        private readonly auditService: AuditService,
    ) {}

    async getSlaMetrics(startDate?: Date, endDate?: Date): Promise<SlaMetrics> {
        // 1. Get orders for period
        // 2. Calculate timelines for each order
        // 3. Aggregate time in each status
        // 4. Calculate overdue
        // 5. Return metrics
    }

    async getOrderTimeline(orderId: string): Promise<OrderTimeline> {
        // 1. Get order
        // 2. Get audit history (status changes)
        // 3. Calculate duration for each status
        // 4. Return timeline
    }

    async getOverdueOrders(): Promise<OrderEntity[]> {
        // Find orders where deadline < now AND status != 'issued'
    }

    async getNearDeadlineOrders(hours = 24): Promise<OrderEntity[]> {
        // Find orders where deadline in (now, now + hours)
    }
}
```

---

## 📝 SQL Queries

### Average time per status

```sql
SELECT 
    metadata->>'new_value' as status,
    AVG(EXTRACT(EPOCH FROM (
        LEAD(created_at) OVER (PARTITION BY order_id ORDER BY created_at) 
        - created_at
    )) * 1000) as avg_duration_ms
FROM order_lifecycle
WHERE action_type = 'status_change'
GROUP BY metadata->>'new_value';
```

### Overdue orders

```sql
SELECT 
    o.id,
    o.status,
    o.deadline,
    o.client_id,
    EXTRACT(DAY FROM (NOW() - o.deadline)) as days_overdue
FROM orders o
WHERE o.deadline < NOW()
  AND o.status != 'issued'
ORDER BY o.deadline ASC;
```

---

## 🎨 Форматирование времени

```typescript
formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
}
```

---

## 📚 Связанные файлы

- [`apps/api/src/modules/orders/sla.service.ts`](../apps/api/src/modules/orders/sla.service.ts)
- [`apps/api/src/modules/orders/audit.service.ts`](../apps/api/src/modules/orders/audit.service.ts)
- [`docs/AUDIT_SYSTEM.md`](./AUDIT_SYSTEM.md)
- [`docs/ORDER_STATE_MACHINE.md`](./ORDER_STATE_MACHINE.md)

---

**Обновлено:** 3 марта 2026  
**Версия:** 1.0
