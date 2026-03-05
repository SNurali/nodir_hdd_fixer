# ✅ P1-3: SLA Metrics Complete

**Дата:** 3 марта 2026  
**Статус:** ✅ Выполнено

---

## 📊 Выполненные задачи

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| P1-1 | State Machine | `order-state-machine.ts` | ✅ |
| P1-2 | Аудит действий | `audit.service.ts` | ✅ |
| P1-3 | **SLA метрики** | `sla.service.ts`, endpoints | ✅ |

---

## 🎯 Реализация P1-3

### 1. SlaService

**Файл:** `apps/api/src/modules/orders/sla.service.ts`

**Методы:**

| Метод | Назначение |
|-------|------------|
| `getSlaMetrics()` | Общие SLA метрики за период |
| `getOrderTimeline()` | Таймлайн заказа с длительностью |
| `getOverdueOrders()` | Просроченные заказы |
| `getNearDeadlineOrders()` | Близкие к дедлайну |
| `getAverageCompletionTime()` | Среднее время выполнения |
| `getMasterStats()` | Статистика мастера |
| `getSlaReport()` | Отчёт по периодам |

---

### 2. API Endpoints

| Endpoint | Method | Permissions |
|----------|--------|-------------|
| `/orders/stats/sla` | GET | Admin, Operator |
| `/orders/stats/overdue` | GET | Admin, Operator |
| `/orders/stats/near-deadline` | GET | Admin, Operator |
| `/orders/:id/timeline` | GET | All |
| `/orders/stats/average-completion` | GET | Admin, Operator |
| `/orders/stats/report` | GET | Admin, Operator |

---

### 3. Интеграция

**OrdersModule:**
```typescript
@Module({
    providers: [OrdersService, AuditService, SlaService],
    exports: [OrdersService, AuditService, SlaService],
})
```

**OrdersController:**
```typescript
constructor(
    private readonly ordersService: OrdersService,
    private readonly slaService: SlaService,
) { }

@Get('stats/sla')
getSlaMetrics(@Query('startDate') startDate?: string, ...) {
    return this.slaService.getSlaMetrics(...);
}
```

---

## 📋 SLA Metrics Structure

```typescript
interface SlaMetrics {
    average_time_in_status: Record<string, number>; // ms
    total_orders: number;
    completed_orders: number;
    overdue_orders: number;
    on_time_percentage: number; // 0-100
    by_status: StatusMetrics[];
}

interface StatusMetrics {
    status: string;
    count: number;
    average_duration_ms: number;
    average_duration_formatted: string; // "2ч 30м"
}
```

---

## 📊 Timeline Structure

```typescript
interface OrderTimeline {
    order_id: string;
    timeline: TimelineEntry[];
    total_duration_ms: number;
    is_overdue: boolean;
}

interface TimelineEntry {
    status: string;
    entered_at: Date;
    exited_at: Date | null;
    duration_ms: number | null;
    duration_formatted: string | null; // "2ч" or "в процессе"
}
```

---

## 🎨 Frontend Integration

### Dashboard

```tsx
// SLA Stats
const { data: sla } = useSWR('/orders/stats/sla', fetcher);

<div className="grid grid-cols-4 gap-4">
    <StatCard title="Всего" value={sla.total_orders} />
    <StatCard title="Завершено" value={sla.completed_orders} color="green" />
    <StatCard title="Просрочено" value={sla.overdue_orders} color="red" />
    <StatCard title="On-time" value={`${sla.on_time_percentage.toFixed(1)}%`} />
</div>

// Timeline
const { data: timeline } = useSWR(`/orders/${orderId}/timeline`, fetcher);

<Timeline>
    {timeline.timeline.map(entry => (
        <TimelineItem
            status={entry.status}
            duration={entry.duration_formatted}
            date={formatDate(entry.entered_at)}
        />
    ))}
</Timeline>

// Overdue Alert
const { data: overdue } = useSWR('/orders/stats/overdue', fetcher);

{overdue.length > 0 && (
    <Alert variant="error">
        ⚠️ {overdue.length} просроченных заказов
    </Alert>
)}
```

---

## 📈 Примеры данных

### SLA Metrics Response

```json
{
    "average_time_in_status": {
        "new": 7200000,
        "accepted": 3600000,
        "in_progress": 86400000,
        "waiting_for_parts": 172800000,
        "completed": 14400000,
        "issued": 0
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

### Timeline Response

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

## 📊 Статистика P1-3

| Метрика | Значение |
|---------|----------|
| Файлов создано | 2 |
| Файлов изменено | 2 |
| Методов в сервисе | 7 |
| API endpoints | 6 |
| Время реализации | 4ч |

---

## ✅ Progress Update

| Приоритет | Выполнено | Осталось |
|-----------|-----------|----------|
| P0 | 10/10 ✅ | 0 |
| P1 | 3/8 | 5 |
| P2 | 0/8 | 8 |

**Общий прогресс:** 13/26 задач (50%)

---

## 🎯 Следующие задачи

### P1-5: Трекинг заказа (UI)

- Timeline компонент
- Детали изменений
- Фильтрация по типу

### P1-6: Уведомления "что дальше"

- Email уведомления
- Push уведомления
- SMS (опционально)

### P1-7: Финансовая отчётность

- Revenue reports
- Unpaid/overdue
- Payment analytics

---

**Обновлено:** 3 марта 2026, 20:00  
**Готово к:** P1-5, P1-6, или P1-7
