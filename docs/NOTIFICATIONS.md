# 📬 Notifications System Documentation

## 🎯 Overview

Система уведомлений для HDD Fixer поддерживает множественные каналы связи:
- **Email** (SendGrid / SMTP)
- **SMS** (Twilio / локальный SMS шлюз)
- **Push** (Firebase FCM)
- **Telegram** (Telegram Bot API)
- **In-App** (внутренние уведомления)

---

## 📋 Architecture

```
┌─────────────────┐
│  Order Event    │
│  (status change)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notifications   │
│ Service         │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    │         │          │         │
    ▼         ▼          ▼         ▼
┌──────┐  ┌─────┐  ┌────────┐  ┌────────┐
│Email │  │ SMS │  │  Push  │  │ In-App │
│SMTP  │  │GW   │  │  FCM   │  │  DB    │
└──────┘  └─────┘  └────────┘  └────────┘
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM=noreply@hdd-fixer.uz

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890

# Push (Firebase)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

---

## 📤 API Endpoints

### Get My Notifications

```http
GET /notifications?page=1&limit=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "channel": "in_app",
      "template_key": "status_change",
      "payload": {
        "status": "В работе",
        "orderId": "6848AA4E"
      },
      "is_read": false,
      "created_at": "2024-03-03T10:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 50
  }
}
```

---

### Get Unread Count

```http
GET /notifications/unread
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 5
}
```

---

### Mark as Read

```http
PATCH /notifications/:id/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Mark All as Read

```http
POST /notifications/read-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

## 📨 Notification Types

### 1. Order Status Change

**Trigger:** Когда статус заказа изменяется

**Channels:** Email, SMS, Push, In-App

**Template Variables:**
- `orderId` - ID заказа
- `status` - Новый статус
- `clientName` - Имя клиента
- `language` - Язык (ru/en/uz-cyr/uz-lat)

---

### 2. Price Approval Request

**Trigger:** Когда мастер устанавливает цену

**Channels:** Email, SMS, In-App

**Template Variables:**
- `orderId` - ID заказа
- `price` - Установленная цена
- `language` - Язык

---

### 3. Master Assignment

**Trigger:** Когда мастер назначается на заказ

**Channels:** Email, SMS, In-App

**Template Variables:**
- `orderId` - ID заказа
- `masterName` - Имя мастера
- `language` - Язык

---

## 🎨 Email Templates

Templates находятся в `/apps/api/src/templates/notifications/`

### Available Templates:
- `order-status-change.hbs` - Изменение статуса заказа
- `price-approval.hbs` - Запрос одобрения цены
- `master-assignment.hbs` - Назначение мастера

### Template Syntax (Handlebars)

```handlebars
{{#if (eq language 'ru')}}
    Текст на русском
{{else if (eq language 'en')}}
    Text in English
{{else}}
    Matn o'zbek tilida
{{/if}}
```

---

## 🚀 Usage Examples

### Send Order Status Notification

```typescript
await notificationsService.sendOrderStatusNotification(
  'order-uuid',
  'user-uuid',
  'in_progress',
  'ru'
);
```

### Send Price Approval Notification

```typescript
await notificationsService.sendPriceApprovalNotification(
  'order-uuid',
  'client-uuid',
  150000,
  'ru'
);
```

### Send Master Assignment Notification

```typescript
await notificationsService.sendMasterAssignmentNotification(
  'order-uuid',
  'master-uuid',
  'ru'
);
```

---

## 📊 Database Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    channel VARCHAR(10) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    language VARCHAR(6) NOT NULL DEFAULT 'ru',
    payload JSONB DEFAULT '{}',
    status VARCHAR(10) DEFAULT 'pending',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
```

---

## 🔗 Integration Points

### Orders Service

```typescript
// In orders.service.ts
async updateStatus(orderId: string, newStatus: string) {
  // Update order status
  await this.orderRepo.update(orderId, { status: newStatus });
  
  // Send notification
  const order = await this.orderRepo.findOne({ where: { id: orderId } });
  await this.notificationsService.sendOrderStatusNotification(
    orderId,
    order.client.user_id,
    newStatus,
    order.language
  );
}
```

---

## 📱 Mobile Push Notifications

### Firebase FCM Setup

1. Установите Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Настройте service account:
```typescript
import * as admin from 'firebase-admin';

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

3. Отправка push уведомлений:
```typescript
const message = {
  token: deviceToken,
  notification: {
    title: 'Статус заказа изменён',
    body: 'В работе'
  },
  data: {
    orderId: 'order-uuid',
    type: 'status_change'
  }
};

await admin.messaging().send(message);
```

---

## ✅ Testing

### Unit Tests

```typescript
describe('NotificationsService', () => {
  it('should send order status notification', async () => {
    const result = await service.sendOrderStatusNotification(
      'order-123',
      'user-123',
      'completed',
      'ru'
    );
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```bash
# Run tests
npm run test:notifications

# Run with coverage
npm run test:notifications -- --coverage
```

---

## 📈 Monitoring

### Metrics to Track

- Email delivery rate
- SMS delivery rate
- Push notification open rate
- Average delivery time
- Failed notifications count

### Logging

```typescript
this.logger.log(`Email sent: ${info.messageId}`);
this.logger.error(`Email failed: ${error.message}`);
```

---

## 🔐 Security

- Все уведомления подписываются JWT токеном
- Email/SMS шаблоны валидируются
- Rate limiting для предотвращения спама
- GDPR compliance для EU пользователей

---

## 📝 TODO

- [ ] Интеграция с SendGrid для Email
- [ ] Интеграция с Twilio для SMS
- [ ] Интеграция с Firebase FCM для Push
- [ ] Интеграция с Telegram Bot API
- [ ] Очереди уведомлений с BullMQ
- [ ] Retry механизм для failed уведомлений
- [ ] A/B тестирование шаблонов
- [ ] Analytics dashboard

---

**Version:** 1.0  
**Last Updated:** 2024-03-03  
**Author:** HDD Fixer Team
