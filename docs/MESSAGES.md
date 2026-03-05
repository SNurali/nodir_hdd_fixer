# 💬 Messages/Chat System Documentation

## 🎯 Overview

Система сообщений для общения между клиентами и сотрудниками сервисного центра.

**Возможности:**
- Обмен сообщениями по конкретному заказу
- Автоматические уведомления о статусе заказа
- Уведомления об установке цены
- Real-time обновления (WebSocket - готов к интеграции)
- История переписки
- Статус прочтения сообщений

---

## 📋 Architecture

```
┌─────────────────┐
│  Chat UI        │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Messages        │
│ Controller      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Messages        │
│ Service         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ (messages)      │
└─────────────────┘
```

---

## 📤 API Endpoints

### Get Messages for Order

```http
GET /orders/:orderId/messages
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "message-uuid",
    "order_id": "order-uuid",
    "sender_id": "user-uuid",
    "sender": {
      "id": "user-uuid",
      "full_name": "Admin User",
      "role": "admin"
    },
    "text": "Ваш заказ принят в работу",
    "is_read": true,
    "read_at": "2024-03-03T10:00:00Z",
    "created_at": "2024-03-03T09:00:00Z"
  }
]
```

---

### Send Message

```http
POST /orders/:orderId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Когда будет готов заказ?",
  "recipient_id": "user-uuid" // optional
}
```

**Response:**
```json
{
  "id": "message-uuid",
  "order_id": "order-uuid",
  "sender_id": "user-uuid",
  "text": "Когда будет готов заказ?",
  "is_read": false,
  "created_at": "2024-03-03T10:00:00Z"
}
```

---

### Get Chat Participants

```http
GET /orders/:orderId/messages/participants
Authorization: Bearer <token>
```

**Response:**
```json
{
  "order_id": "order-uuid",
  "client_id": "client-user-uuid",
  "participants": [
    {
      "id": "user-uuid",
      "full_name": "Admin User",
      "role": "admin"
    },
    {
      "id": "client-user-uuid",
      "full_name": "Client User",
      "role": "client"
    }
  ]
}
```

---

### Get Unread Messages Count

```http
GET /orders/:orderId/messages/unread
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 5
}
```

---

### Mark Message as Read

```http
PATCH /orders/:orderId/messages/:messageId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Mark All Messages as Read

```http
POST /orders/:orderId/messages/read-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

## 🤖 Automated Messages

### 1. Order Status Update

**Trigger:** При изменении статуса заказа

**Template:**
```
RU: Ваш заказ перешёл в статус: {status}
EN: Your order has been updated to: {status}
UZ: Buyurtmangiz holati o'zgardi: {status}
```

**Example:**
```typescript
await messagesService.sendStatusUpdate(
  'order-uuid',
  'in_progress',
  'ru'
);
```

---

### 2. Price Approval Request

**Trigger:** При установке цены за заказ

**Template:**
```
RU: Мастер установил цену за выполнение работ: {price} UZS. Пожалуйста, одобрите цену в личном кабинете.
EN: Master has set the price for the work: {price} UZS. Please approve the price in your dashboard.
UZ: Usta ish narxini belgiladi: {price} so'm. Iltimos, narxni tasdiqlang.
```

**Example:**
```typescript
await messagesService.sendPriceRequest(
  'order-uuid',
  150000,
  'ru'
);
```

---

## 📊 Database Schema

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
```

---

## 🚀 Usage Examples

### Get Order Messages

```typescript
// Frontend
const response = await api.get(`/orders/${orderId}/messages`);
const messages = response.data;

// Display messages
messages.forEach(msg => {
  console.log(`${msg.sender.full_name}: ${msg.text}`);
});
```

---

### Send Message

```typescript
// Frontend
await api.post(`/orders/${orderId}/messages`, {
  text: 'Здравствуйте! Когда будет готов заказ?',
  recipient_id: 'admin-user-uuid' // optional
});
```

---

### Auto-scroll to Latest Message

```typescript
// Frontend (React)
const messagesEndRef = useRef(null);

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

// In render
<div className="messages-container">
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
  <div ref={messagesEndRef} />
</div>
```

---

### Real-time Updates (WebSocket)

```typescript
// Frontend (Socket.io example)
const socket = io('http://localhost:3002');

socket.on('message:new', (data) => {
  setMessages(prev => [...prev, data]);
});

socket.on('message:read', (data) => {
  setMessages(prev => prev.map(msg => 
    msg.id === data.messageId ? { ...msg, is_read: true } : msg
  ));
});
```

---

## 🎨 Frontend Chat Component

### Basic Chat UI

```tsx
import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function OrderChat({ orderId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const loadMessages = async () => {
    const response = await api.get(`/orders/${orderId}/messages`);
    setMessages(response.data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await api.post(`/orders/${orderId}/messages`, {
      text: newMessage
    });
    
    setNewMessage('');
    loadMessages();
  };

  useEffect(() => {
    loadMessages();
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_id === userId ? 'own' : 'other'}`}>
            <div className="message-text">{msg.text}</div>
            <div className="message-meta">
              <span>{msg.sender.full_name}</span>
              <span>{new Date(msg.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
        />
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}
```

---

## 🔐 Security

### Access Control

- **Client** может видеть сообщения только своих заказов
- **Master** видит сообщения назначенных заказов
- **Admin/Operator** видят все сообщения

### Message Validation

```typescript
// Check message length
if (text.length > 10000) {
  throw new BadRequestException('Message too long');
}

// Check for spam
if (text.match(/(spam|scam)/i)) {
  throw new BadRequestException('Invalid message content');
}
```

---

## 📈 Monitoring

### Metrics to Track

- Total messages sent
- Average response time
- Unread messages count
- Most active orders

### Logging

```typescript
this.logger.log(`Message sent: ${message.id} for order ${orderId}`);
this.logger.error(`Message send failed: ${error.message}`);
```

---

## ✅ Testing

### Unit Tests

```typescript
describe('MessagesService', () => {
  it('should send message', async () => {
    const message = await service.sendMessage(
      'order-123',
      'user-123',
      'Hello!'
    );
    
    expect(message.text).toBe('Hello!');
    expect(message.is_read).toBe(false);
  });

  it('should mark message as read', async () => {
    await service.markAsRead('message-123', 'user-123');
    
    const message = await repo.findOne('message-123');
    expect(message.is_read).toBe(true);
  });
});
```

---

## 📝 TODO

- [x] Message entity
- [x] Messages service
- [x] Messages controller
- [x] Automated status messages
- [x] Automated price request messages
- [ ] WebSocket real-time updates
- [ ] File attachments
- [ ] Voice messages
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message search
- [ ] Chat analytics dashboard

---

**Version:** 1.0  
**Last Updated:** 2024-03-03  
**Author:** HDD Fixer Team
