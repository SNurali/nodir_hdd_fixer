# 🧪 HDD Fixer - Testing Guide

## 📋 Pre-requisites

### 1. Start Backend
```bash
cd /home/mrnurali/nodir_hdd_fixer/apps/api
npm run start:dev
```

### 2. Start Frontend
```bash
cd /home/mrnurali/nodir_hdd_fixer/apps/web
npm run dev
```

### 3. Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.uz | admin123 |
| Operator | operator@test.uz | operator123 |
| Master | master@test.uz | master123 |
| Client | client@test.uz | client123 |

---

## 🎯 Test Scenario 1: Full Order Lifecycle

### Step 1: Client Creates Order (5 min)

1. **Login as Client**
   - URL: `http://localhost:3000/login`
   - Email: `client@test.uz`
   - Password: `client123`

2. **Create New Order**
   - URL: `http://localhost:3000/orders/new`
   - Step 1: Select equipment (e.g., "Жесткий диск")
   - Step 2: Select issue (e.g., "Не определяется")
   - Step 3: Fill contacts
   - Step 4: Confirm and submit

3. **Verify Order Created**
   - URL: `http://localhost:3000/`
   - Check order appears in dashboard
   - Status should be "В ожидании"

---

### Step 2: Admin Accepts Order (5 min)

1. **Login as Admin**
   - URL: `http://localhost:3000/login`
   - Email: `admin@test.uz`
   - Password: `admin123`

2. **View All Orders**
   - URL: `http://localhost:3000/admin/orders`
   - Find the new order
   - Check status "В ожидании"

3. **Open Order Details**
   - URL: `http://localhost:3000/admin/orders/[order-id]`
   - View order information
   - View client details

4. **Change Status to "Принят"**
   - Click "Принят" button
   - Verify status changed
   - Check notification sent to client

5. **Assign Master**
   - Select master from dropdown
   - Click "Назначить"
   - Verify master assigned

6. **Change Status to "В работе"**
   - Click "В работе" button
   - Verify status changed

---

### Step 3: Admin Sets Price (3 min)

1. **Set Price for Order**
   - In order details page
   - Enter price: 150000 UZS
   - Save price

2. **Verify Client Notification**
   - Check messages tab
   - Automated message should appear
   - "Мастер установил цену: 150 000 UZS"

---

### Step 4: Client Approves Price (3 min)

1. **Login as Client**
   - URL: `http://localhost:3000/login`

2. **View Order**
   - URL: `http://localhost:3000/orders/[order-id]`
   - See price approval card
   - Price: 150 000 UZS

3. **Approve Price**
   - Click "Одобрить цену"
   - Verify status changed to "Цена одобрена"

---

### Step 5: Master Completes Work (5 min)

1. **Login as Master**
   - URL: `http://localhost:3000/login`
   - Email: `master@test.uz`
   - Password: `master123`

2. **View Assigned Orders**
   - URL: `http://localhost:3000/orders`
   - Find assigned order

3. **Change Status to "Завершён"**
   - Click "Завершён" button
   - Add completion comment
   - Verify status changed

---

### Step 6: Admin Adds Payment (3 min)

1. **Login as Admin**
   - URL: `http://localhost:3000/login`

2. **Add Payment**
   - Go to order details
   - Click "Добавить оплату"
   - Type: CASH
   - Amount: 150000 UZS
   - Save

3. **Verify Payment History**
   - Check payments tab
   - Payment should appear

---

### Step 7: Admin Closes Order (3 min)

1. **Verify Full Payment**
   - Total: 150000 UZS
   - Paid: 150000 UZS
   - Balance: 0 UZS

2. **Change Status to "Выдан"**
   - Click "Выдан" button
   - Order closed

---

### Step 8: Client Receives Order (2 min)

1. **Login as Client**
   - URL: `http://localhost:3000/login`

2. **View Order**
   - Status: "Выдан"
   - Can pickup order

---

## 🎯 Test Scenario 2: Messages/Chat

### Test Chat Functionality (10 min)

1. **Admin Sends Message**
   - Go to order details
   - Messages tab
   - Send: "Здравствуйте! Ваш заказ в работе."

2. **Client Receives Message**
   - Login as client
   - Open order
   - Check messages
   - Should see admin message

3. **Client Replies**
   - Send: "Когда будет готов?"
   - Check message appears

4. **Check Unread Count**
   - Login as admin
   - Check unread counter
   - Should show 1 unread

5. **Mark as Read**
   - Click message
   - Verify read status changed

---

## 🎯 Test Scenario 3: Payments

### Test Payment Flow (10 min)

1. **Create Order Without Payment**
   - Total: 150000 UZS
   - Paid: 0 UZS
   - Balance: 150000 UZS

2. **Add Partial Payment**
   - Type: CASH
   - Amount: 50000 UZS
   - Paid: 50000 UZS
   - Balance: 100000 UZS

3. **Add Second Payment**
   - Type: CARD
   - Amount: 100000 UZS
   - Paid: 150000 UZS
   - Balance: 0 UZS

4. **Verify Payment History**
   - Two payments should appear
   - Total matches order total

---

## 🎯 Test Scenario 4: Notifications

### Test Notification System (5 min)

1. **Trigger Status Change**
   - Admin changes order status
   - Check client notifications

2. **Check Notification Center**
   - Login as client
   - Check notification bell
   - Should show new notification

3. **Mark as Read**
   - Click notification
   - Verify marked as read

---

## 🐛 Bug Reporting Template

```markdown
### Bug Report

**Title:** [Brief description]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: [e.g., Chrome, Firefox]
- URL: [e.g., http://localhost:3000/admin/orders]
- User Role: [admin/operator/master/client]
```

---

## ✅ Test Completion Checklist

- [ ] All 8 order lifecycle steps completed
- [ ] Chat messages working
- [ ] Payments recorded correctly
- [ ] Notifications sent
- [ ] All roles tested (admin/operator/master/client)
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Mobile responsive (if tested on mobile)

---

## 📊 Test Results Template

```markdown
## Test Results

**Date:** 2024-03-03
**Tester:** [Your Name]
**Environment:** Local Development

### Passed Tests:
- [x] Order Creation
- [x] Status Management
- [x] Master Assignment
- [x] Price Approval
- [x] Payment Processing
- [x] Chat/Messages
- [x] Notifications

### Failed Tests:
- [ ] [List any failures]

### Issues Found:
1. [Issue 1]
2. [Issue 2]

### Overall Status:
✅ PASS / ❌ FAIL

### Recommendations:
[Any improvements needed]
```

---

**Happy Testing! 🚀**
