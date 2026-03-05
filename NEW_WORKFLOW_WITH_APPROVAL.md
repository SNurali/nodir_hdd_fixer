# 📋 НОВЫЙ WORKFLOW С СОГЛАСОВАНИЕМ ЦЕНЫ

## 🎯 Полная схема работы (обновлено 2026-03-05)

```
┌─────────────┐
│    new      │ ◄────────────────────────────────────────────────┐
│  (Новый)    │                                                  │
└──────┬──────┘                                                  │
       │                                                         │
       ├─► accepted ──► diagnosing ──► pending_approval ──┬──────┤
       │       │              │              │             │      │
       │       │              │              ├─► approved ─┘      │
       │       │              │              │                    │
       │       │              └──────────────┘ (клиент отклонил)  │
       │       │                                                 │
       │       └─────────────────────────────────────────────────┘
       │
       └─► cancelled
```

### 📊 Этапы работы с согласованием цены:

```
1. new (Новый)
   ↓
2. accepted (Принят)
   ↓
3. diagnosing (Диагностика)
   ↓
4. pending_approval (Ожидает согласования цены)
   ↓ [Клиент одобряет цену]
5. approved (Одобрено)
   ↓
6. in_progress (В работе)
   ↓
7. completed (Завершён)
   ↓
8. issued (Выдан)
```

## 🆕 Новые статусы

| Статус | Описание | Кто может установить |
|--------|----------|---------------------|
| `diagnosing` | Диагностика устройства | Admin, Operator, Master |
| `pending_approval` | Ожидает согласования цены | Admin, Operator, Master (после установки цены) |
| `approved` | Цена одобрена клиентом | Client (через одобрение) |

## 🔄 Разрешённые переходы

### Из `new` (Новый):
- ✅ → `accepted` — Admin, Operator
- ✅ → `diagnosing` — Admin, Operator, Master
- ✅ → `cancelled` — Admin, Operator

### Из `accepted` (Принят):
- ✅ → `diagnosing` — Admin, Operator, Master
- ✅ → `new` — Admin, Operator

### Из `diagnosing` (Диагностика):
- ✅ → `pending_approval` — Admin, Operator, Master **(после установки цены)**
- ✅ → `accepted` — Admin, Operator, Master

### Из `pending_approval` (Ожидает согласования):
- ✅ → `approved` — **Client** (одобрение цены)
- ✅ → `diagnosing` — Admin, Operator, Master (изменить цену)
- ✅ → `cancelled` — Admin, Operator, Client

### Из `approved` (Одобрено):
- ✅ → `in_progress` — Admin, Operator, Master **(начало ремонта)**
- ✅ → `pending_approval` — Admin, Operator, Master (изменить цену)

### Из `in_progress` (В работе):
- ✅ → `waiting_for_parts` — Admin, Operator, Master
- ✅ → `completed` — Admin, Operator, Master
- ✅ → `unrepairable` — Admin, Operator, Master
- ✅ → `issued` — Admin, Operator

## 📝 ПОШАГОВЫЙ WORKFLOW

### 🔹 Шаг 1: Создание заказа
```
POST /orders
{
  "client_id": "...",
  "details": [...],
  "language": "ru"
}
```
**Статус:** `new`

---

### 🔹 Шаг 2: Принятие заказа
```
PATCH /orders/:id
{ "status": "accepted" }
```
**Кто:** Admin, Operator  
**Статус:** `accepted`

---

### 🔹 Шаг 3: Диагностика
```
PATCH /orders/:id
{ "status": "diagnosing" }
```
**Кто:** Admin, Operator, Master  
**Статус:** `diagnosing`

---

### 🔹 Шаг 4: Установка цены (автоматически меняет статус)
```
POST /orders/:id/set-price
{
  "details": [
    { "detail_id": "...", "price": 500000 }
  ]
}
```
**Кто:** Admin, Operator, Master  
**Статус:** `pending_approval` ⚠️ **АВТОМАТИЧЕСКИ!**

**📧 Уведомление:** Клиент получает уведомление о выставленной цене

---

### 🔹 Шаг 5: Одобрение цены клиентом
```
POST /orders/:id/approve-price
```
**Кто:** **Client** (только владелец заказа)  
**Статус:** `approved` ✅

**📧 Уведомление:** Админ/Мастер получают уведомление об одобрении

---

### 🔹 Шаг 6: Начало ремонта
```
PATCH /orders/:id
{ "status": "in_progress" }
```
**Кто:** Admin, Operator, Master  
**Статус:** `in_progress`

---

### 🔹 Шаг 7: Завершение ремонта
```
PATCH /orders/:id
{ "status": "completed" }
```
**Кто:** Admin, Operator, Master  
**Статус:** `completed`

---

### 🔹 Шаг 8: Оплата и выдача
```
# Принять оплату
POST /orders/:id/payments
{
  "payment_type": "uzcard",
  "paid_amount": 500000,
  "currency": "UZS"
}

# Выдать заказ
PATCH /orders/:id
{ "status": "issued" }
```
**Кто:** Admin, Operator  
**Статус:** `issued` ✅

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### 1. **Без одобрения цены ремонт начинать НЕЛЬЗЯ**
- Статус `pending_approval` → `in_progress` **запрещён**
- Сначала клиент должен одобрить цену (`approved`)

### 2. **Цена может быть изменена**
- До одобрения: Master/Admin может изменить цену (статус остаётся `pending_approval`)
- После одобрения: Только через отмену и новое согласование

### 3. **Клиент может отклонить цену**
```
POST /orders/:id/reject-price
{
  "reason": "Слишком дорого"
}
```
**Статус:** Возвращается в `diagnosing` или `cancelled`

### 4. **Уведомления отправляются автоматически**
- 📧 При установке цены → **Клиенту**
- 📧 При одобрении цены → **Админу/Мастеру**
- 📧 При изменении статуса → **Клиенту**

---

## 🎨 UI Цвета статусов

| Статус | Цвет | Иконка |
|--------|------|--------|
| `new` | 🟣 Purple | Clock |
| `accepted` | 🔵 Blue | UserCheck |
| `diagnosing` | 🔷 Cyan | Search |
| `pending_approval` | 🟠 Orange | AlertCircle |
| `approved` | 🟢 Green | CheckCircle |
| `in_progress` | 🟡 Yellow | Hammer |
| `waiting_for_parts` | 🟠 Orange | Clock |
| `completed` | 🟩 Emerald | CheckCircle2 |
| `unrepairable` | 🔴 Red | XCircle |
| `issued` | 🔷 Teal | PackageCheck |
| `cancelled` | ⬜ Gray | XCircle |

---

## 📱 Уведомления

### Типы уведомлений:

| Событие | Кто получает | Текст (RU) |
|---------|-------------|------------|
| `price_set` | Клиент | "Цена за ваш заказ установлена: X UZS. Пожалуйста, одобрите." |
| `price_approved` | Админ/Мастер | "Клиент одобрил цену. Можно начинать ремонт." |
| `price_rejected` | Админ/Мастер | "Клиент отклонил цену: {причина}" |
| `order_status_changed` | Клиент | "Статус вашего заказа изменён: {статус}" |

---

## 🔐 Права доступа

| Действие | Admin | Operator | Master | Client |
|----------|-------|----------|--------|--------|
| Принять заказ | ✅ | ✅ | ❌ | ❌ |
| Начать диагностику | ✅ | ✅ | ✅ | ❌ |
| Установить цену | ✅ | ✅ | ✅ | ❌ |
| Одобрить цену | ❌ | ❌ | ❌ | ✅ |
| Отклонить цену | ✅ | ✅ | ❌ | ✅ |
| Начать ремонт | ✅ | ✅ | ✅ | ❌ |
| Завершить ремонт | ✅ | ✅ | ✅ | ❌ |
| Выдать заказ | ✅ | ✅ | ❌ | ❌ |

---

## 📊 Примеры сценариев

### ✅ Стандартный ремонт с согласованием

```
new → accepted → diagnosing → pending_approval → approved → in_progress → completed → issued
```

### ⚠️ Клиент отклонил цену

```
new → accepted → diagnosing → pending_approval → (client rejects) → diagnosing → pending_approval (новая цена) → approved → in_progress → completed → issued
```

### ⚡ Экспресс-ремонт (без диагностики)

```
new → accepted → pending_approval → approved → in_progress → completed → issued
```

### ❌ Отмена заказа клиентом

```
new → accepted → diagnosing → pending_approval → (client cancels) → cancelled
```

---

## 🛠️ API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/orders/:id` | PATCH | Изменить статус |
| `/orders/:id/set-price` | POST | Установить цену (→ `pending_approval`) |
| `/orders/:id/update-price` | POST | Обновить цену |
| `/orders/:id/approve-price` | POST | **Одобрить цену (Client)** |
| `/orders/:id/reject-price` | POST | Отклонить цену |
| `/orders/:id/accept` | POST | Принять заказ |
| `/orders/:id/diagnose` | POST | Начать диагностику |
| `/orders/:id/close` | POST | Закрыть заказ |
| `/orders/:id/allowed-transitions` | GET | Доступные переходы |

---

## 🎯 Ключевые изменения

| Было | Стало |
|------|-------|
| Цена устанавливалась в `in_progress` | Цена устанавливается в `pending_approval` |
| Ремонт начинался без одобрения | Ремонт только после `approved` |
| Клиент не участвовал в согласовании | Клиент одобряет цену через API |
| Нет уведомлений о цене | Автоматические уведомления |

---

**Дата обновления:** 2026-03-05  
**Версия:** 3.0 (С согласованием цены)  
**Статус:** ✅ Готово к продакшену
