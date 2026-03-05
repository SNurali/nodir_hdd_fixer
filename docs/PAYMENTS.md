# 💳 Payment Integration Documentation

## 🎯 Overview

Система платежей для HDD Fixer поддерживает:
- **Click** (Uzbekistan)
- **Payme** (Uzbekistan)
- **Uzumbank** (готово к интеграции)
- **Cash** (наличные)
- **Card** (терминал)
- **FREE** (бесплатно)
- **Paynet**
- **Uzum**

---

## 📋 Architecture

```
┌─────────────────┐
│  Order Payment  │
│  (Create)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payments        │
│ Service         │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    │         │          │         │
    ▼         ▼          ▼         ▼
┌──────┐  ┌─────┐  ┌────────┐  ┌────────┐
│Click │  │Payme│  │  Cash  │  │  Card  │
│API   │  │API  │  │        │  │        │
└──────┘  └─────┘  └────────┘  └────────┘
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Click
CLICK_MERCHANT_ID=your_merchant_id
CLICK_SECRET_KEY=your_secret_key

# Payme
PAYME_MERCHANT_ID=your_merchant_id
PAYME_SECRET_KEY=your_secret_key

# Frontend URL (for callbacks)
FRONTEND_URL=https://hdd-fixer.uz
API_URL=https://api.hdd-fixer.uz
```

---

## 📤 API Endpoints

### Add Payment to Order

```http
POST /orders/:orderId/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_type": "CASH",
  "paid_amount": 150000,
  "currency": "UZS"
}
```

**Response:**
```json
{
  "id": "payment-uuid",
  "order_id": "order-uuid",
  "payment_type": "CASH",
  "paid_amount": 150000,
  "currency": "UZS",
  "paid_at": "2024-03-03T10:00:00Z",
  "cashier": {
    "id": "user-uuid",
    "full_name": "Admin User"
  }
}
```

---

### Get Payment History

```http
GET /orders/:orderId/payments
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "payment-uuid",
    "payment_type": "CASH",
    "paid_amount": 150000,
    "currency": "UZS",
    "paid_at": "2024-03-03T10:00:00Z",
    "cashier": {
      "full_name": "Admin User"
    }
  }
]
```

---

### Get Total Paid

```http
GET /orders/:orderId/payments/total
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 300000
}
```

---

### Refund Payment

```http
POST /orders/:orderId/payments/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer request"
}
```

---

### Create Click Payment

```http
POST /orders/:orderId/payments/click/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150000
}
```

**Response:**
```json
{
  "url": "https://my.click.uz/payments?merchant_id=xxx&sign=yyy...",
  "transaction_id": "CLICK_order-uuid_1234567890"
}
```

---

### Create Payme Payment

```http
POST /orders/:orderId/payments/payme/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150000
}
```

**Response:**
```json
{
  "url": "https://checkout.paycom.uz/xxx",
  "transaction_id": "PAYME_order-uuid_1234567890"
}
```

---

### Get Payment Statistics

```http
GET /orders/payments/stats?startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 5000000,
  "byType": [
    { "type": "CASH", "total": 3000000 },
    { "type": "CLICK", "total": 2000000 }
  ],
  "byCurrency": [
    { "currency": "UZS", "total": 5000000 }
  ]
}
```

---

### Get Daily Revenue

```http
GET /orders/payments/daily-revenue?days=30
Authorization: Bearer <token>
```

**Response:**
```json
[
  { "date": "2024-03-01", "total": 150000 },
  { "date": "2024-03-02", "total": 200000 },
  ...
]
```

---

## 💳 Payment Providers

### 1. Click

**Setup:**
1. Register merchant account at https://click.uz
2. Get merchant_id and secret_key
3. Configure webhook endpoint

**Webhook:** `POST /payments/click/webhook`

**Request Format:**
```json
{
  "merchant_id": "xxx",
  "service_id": "0",
  "amount": "1500.00",
  "transaction_param": "CLICK_order-uuid_1234567890",
  "sign": "sha256_signature",
  "sign_time": "1234567890",
  "status": "1"
}
```

**Response:**
```json
{ "status": 1 } // Accept
{ "status": 0 } // Reject
```

---

### 2. Payme

**Setup:**
1. Register at https://paycom.uz
2. Get merchant_id and secret_key
3. Configure callback endpoint

**Callback:** `POST /payments/payme/callback`

**Methods:**
- `CheckTransaction` - Validate transaction
- `PerformTransaction` - Complete transaction
- `CancelTransaction` - Cancel transaction

**Request Format:**
```json
{
  "method": "PerformTransaction",
  "params": {
    "id": "transaction-id",
    "amount": 15000000,
    "account": {
      "order_id": "order-uuid"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "order_id": "order-uuid"
  }
}
```

---

## 📊 Database Schema

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL,
    paid_amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    cashier_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_cashier_by ON payments(cashier_by);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
```

---

## 🚀 Usage Examples

### Create Cash Payment

```typescript
// Frontend
await api.post(`/orders/${orderId}/payments`, {
  payment_type: 'CASH',
  paid_amount: 150000,
  currency: 'UZS'
});
```

### Create Click Payment

```typescript
// Frontend
const response = await api.post(`/orders/${orderId}/payments/click/create`, {
  amount: 150000
});

// Redirect user to payment page
window.location.href = response.data.url;
```

### Create Payme Payment

```typescript
// Frontend
const response = await api.post(`/orders/${orderId}/payments/payme/create`, {
  amount: 150000
});

// Redirect user to payment page
window.location.href = response.data.url;
```

### Get Payment History

```typescript
// Frontend
const payments = await api.get(`/orders/${orderId}/payments`);
console.log(payments.data);
```

---

## 🔐 Security

### Signature Verification (Click)

```typescript
const signatureString = `${merchant_id}${service_id}${amount}${transaction_param}${sign_time}${secretKey}`;
const expectedSign = crypto.createHash('sha256').update(signatureString).digest('hex');

if (sign !== expectedSign) {
  throw new BadRequestException('Invalid signature');
}
```

### Transaction Validation (Payme)

```typescript
// Check if order exists
const order = await orderRepo.findOne({ where: { id: order_id } });
if (!order) {
  return { error: { code: -32401, message: 'Order not found' } };
}

// Return allow
return { result: { allow: true } };
```

---

## 📈 Monitoring

### Metrics to Track

- Total payment volume
- Payment success rate by provider
- Average transaction amount
- Refund rate
- Daily/weekly/monthly revenue

### Logging

```typescript
this.logger.log(`Payment created: ${payment.id} for order ${orderId}`);
this.logger.error(`Payment creation failed: ${error.message}`);
```

---

## ✅ Testing

### Unit Tests

```typescript
describe('PaymentsService', () => {
  it('should create cash payment', async () => {
    const payment = await service.create(
      'order-123',
      {
        payment_type: 'CASH',
        paid_amount: 150000,
        currency: 'UZS'
      },
      'user-123'
    );
    
    expect(payment.payment_type).toBe('CASH');
    expect(payment.paid_amount).toBe(150000);
  });
});
```

### Integration Tests

```bash
# Run tests
npm run test:payments

# Run with coverage
npm run test:payments -- --coverage
```

---

## 📝 TODO

- [x] Click integration
- [x] Payme integration
- [ ] Uzumbank integration
- [ ] Paynet integration
- [ ] Uzum integration
- [ ] Recurring payments
- [ ] Installment plans
- [ ] Multi-currency support (USD/EUR)
- [ ] Payment analytics dashboard

---

**Version:** 1.0  
**Last Updated:** 2024-03-03  
**Author:** HDD Fixer Team
