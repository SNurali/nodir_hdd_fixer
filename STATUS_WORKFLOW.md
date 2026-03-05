# 📋 Система статусов заказов - HDD Fixer

## 🎯 Полная карта переходов статусов

```
┌─────────────┐
│    new      │ ◄────────────────────────────────────┐
│  (Новый)    │                                      │
└──────┬──────┘                                      │
       │                                             │
       ├─► accepted ──► in_progress ──┬─► completed ──► issued
       │       │              │        │                ▲
       │       │              ├─► waiting_for_parts ────┤
       │       │              │        │                │
       │       │              └─► unrepairable ─────────┤
       │       │                       │                │
       │       └───────────────────────┘                │
       │                                               │
       └─► cancelled ──────────────────────────────────┘
```

## 📊 Описание статусов

| Статус | Описание | Кто может установить |
|--------|----------|---------------------|
| `new` | Новый заказ, ожидает принятия | Все |
| `accepted` | Принят в работу | Admin, Operator |
| `in_progress` | В работе | Admin, Operator, Master |
| `waiting_for_parts` | Ожидание запчастей | Admin, Operator, Master |
| `completed` | Ремонт завершён | Admin, Operator, Master |
| `unrepairable` | Не подлежит ремонту | Admin, Operator, Master |
| `issued` | Выдан клиенту | Admin, Operator |
| `cancelled` | Отменён | Admin, Operator |

## ✅ Разрешённые переходы (обновлено!)

### Из статуса `new` (Новый):
- ✅ → `accepted` (Принят) — **Admin, Operator**
- ✅ → `in_progress` (В работе) — **Admin, Operator, Master**
- ✅ → `cancelled` (Отменён) — **Admin, Operator**

### Из статуса `accepted` (Принят):
- ✅ → `in_progress` (В работе) — **Admin, Operator, Master**
- ✅ → `new` (Вернуть в ожидание) — **Admin, Operator**

### Из статуса `in_progress` (В работе):
- ✅ → `waiting_for_parts` (Ожидание) — **Admin, Operator, Master**
- ✅ → `completed` (Завершён) — **Admin, Operator, Master**
- ✅ → `unrepairable` (Не подлежит) — **Admin, Operator, Master**
- ✅ → `issued` (Выдан) — **Admin, Operator** (экспресс-выдача)

### Из статуса `waiting_for_parts` (Ожидание):
- ✅ → `in_progress` (Возобновить) — **Admin, Operator, Master**
- ✅ → `unrepairable` (Не подлежит) — **Admin, Operator, Master**

### Из статуса `completed` (Завершён):
- ✅ → `issued` (Выдан) — **Admin, Operator**
- ✅ → `in_progress` (На доработку) — **Admin, Operator**

### Из статуса `unrepairable` (Не подлежит):
- ✅ → `issued` (Вернуть клиенту) — **Admin, Operator**
- ✅ → `in_progress` (Возобновить) — **Admin, Operator**

### Из статуса `issued` (Выдан):
- ✅ → `completed` (Рекламация) — **Admin only**

## 🔓 Требования УПРОЩЕНЫ (с 2026-03-05)

**РАНЬШЕ:** Для перехода `new` → `accepted` требовался назначенный мастер.
**ТЕПЕРЬ:** ✅ **Без требований!** Мастер можно назначить позже.

**РАНЬШЕ:** Для перехода `in_progress` → `completed` требовалась установленная цена.
**ТЕПЕРЬ:** ✅ **Без требований!** Цену можно установить позже.

**РАНЬШЕ:** Для `in_progress` → `waiting_for_parts` требовался список запчастей.
**ТЕПЕРЬ:** ✅ **Без требований!** Запчасти можно указать позже.

## 🛠️ Как использовать

### 1. **Создание заказа** (статус `new`)
```
POST /orders
{
  "client_id": "...",
  "details": [...],
  "language": "ru"
}
```

### 2. **Принять заказ** (`new` → `accepted`)
```
PATCH /orders/:id
{
  "status": "accepted"
}
```
**Кто:** Admin, Operator

### 3. **Начать работу** (`accepted` → `in_progress`)
```
PATCH /orders/:id
{
  "status": "in_progress"
}
```
**Кто:** Admin, Operator, Master

### 4. **Назначить мастера**
```
POST /orders/:id/details/:detailId/assign
{
  "master_id": "..."
}
```

### 5. **Установить цену**
```
POST /orders/:id/set-price
{
  "details": [
    { "detail_id": "...", "price": 500000 }
  ]
}
```

### 6. **Завершить ремонт** (`in_progress` → `completed`)
```
PATCH /orders/:id
{
  "status": "completed"
}
```

### 7. **Принять оплату и выдать** (`completed` → `issued`)
```
PATCH /orders/:id
{
  "status": "issued"
}
```

## 🎯 Примеры workflow

### 🔹 Быстрый ремонт (экспресс)
```
new → in_progress → completed → issued
```

### 🔹 Стандартный ремонт
```
new → accepted → in_progress → completed → issued
```

### 🔹 С ожиданием запчастей
```
new → accepted → in_progress → waiting_for_parts → in_progress → completed → issued
```

### 🔹 Невозможный ремонт
```
new → accepted → in_progress → unrepairable → issued (возврат клиенту)
```

### 🔹 Отмена заказа
```
new → cancelled
```

## ⚠️ Важные заметки

1. **Требования теперь информационные** — они не блокируют переход, а только предупреждают.

2. **Цена может быть 0** — бесплатные ремонты возможны.

3. **Мастер может быть назначен в любой момент** — не обязательно до начала работ.

4. **Только Admin может вернуть из `issued`** — для обработки рекламаций.

5. **Клиент может одобрить/отклонить цену** — через `/orders/:id/approve-price` или `/orders/:id/reject-price`.

## 📝 API endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/orders/:id` | PATCH | Изменить статус |
| `/orders/:id/accept` | POST | Принять заказ |
| `/orders/:id/reject` | POST | Отменить заказ |
| `/orders/:id/close` | POST | Закрыть заказ |
| `/orders/:id/set-price` | POST | Установить цену |
| `/orders/:id/update-total-price` | POST | Изменить общую цену |
| `/orders/:id/approve-price` | POST | Одобрить цену (клиент) |
| `/orders/:id/reject-price` | POST | Отклонить цену (клиент) |
| `/orders/:id/assign-master` | POST | Назначить мастера |
| `/orders/:id/allowed-transitions` | GET | Доступные переходы |

## 🔄 Уведомления

При изменении статуса автоматически отправляются уведомления:
- **SMS** (если настроено)
- **Telegram** (если настроено)
- **Push** (если есть FCM токен)
- **В приложении** (всегда)

---

**Дата обновления:** 2026-03-05  
**Версия:** 2.0 (Упрощённые требования)
