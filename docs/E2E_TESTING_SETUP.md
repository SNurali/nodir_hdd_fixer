# 🧪 E2E Testing Setup - Playwright

## 📦 Установка

```bash
npm install -D @playwright/test
npx playwright install
```

## 🎯 Критические пути для тестирования

### 1. Guest Checkout (Гостевой заказ)
- [ ] Создание заказа без аутентификации
- [ ] Получение трекінгового токена
- [ ] Отслеживание статуса заказа

### 2. User Registration & Login
- [ ] Регистрация нового пользователя
- [ ] Логин с phone/email
- [ ] Logout

### 3. Order Creation (Создание заказа)
- [ ] Выбор оборудования
- [ ] Выбор проблемы
- [ ] Установка цены
- [ ] Подтверждение заказа

### 4. Order Workflow (Рабочий процесс)
- [ ] Назначение мастера
- [ ] Диагностика
- [ ] Установка цены мастером
- [ ] Одобрение цены клиентом
- [ ] Выполнение работы
- [ ] Закрытие заказа

### 5. Payment (Оплата)
- [ ] Создание платежа
- [ ] Проверка баланса
- [ ] Возврат платежа (refund)

### 6. Admin Operations
- [ ] Просмотр всех заказов
- [ ] Фильтрация по статусу
- [ ] Назначение мастера на заказ

## 📁 Структура тестов

```
tests/e2e/
├── fixtures/
│   ├── test-base.ts       # Базовые фикстуры
│   └── auth-fixture.ts    # Аутентификация
├── specs/
│   ├── guest-checkout.spec.ts
│   ├── auth.spec.ts
│   ├── order-create.spec.ts
│   ├── order-workflow.spec.ts
│   ├── payment.spec.ts
│   └── admin.spec.ts
├── utils/
│   ├── api-helper.ts      # API хелперы
│   ├── test-data.ts       # Тестовые данные
│   └── assertions.ts      # Кастомные ассерты
└── playwright.config.ts   # Конфигурация
```

## 🚀 Запуск тестов

```bash
# Запустить все тесты
npm run test:e2e

# Запустить конкретный тест
npm run test:e2e -- guest-checkout

# Запустить с UI
npm run test:e2e:ui

# Запустить в headed режиме
npm run test:e2e -- --headed

# Запустить конкретный файл
npx playwright test tests/e2e/specs/auth.spec.ts
```

## 📊 Отчётность

```bash
# HTML отчёт
npx playwright show-report

# JSON отчёт
npx playwright test --reporter=json

# JUnit отчёт (для CI)
npx playwright test --reporter=junit
```

## 🔧 CI/CD Интеграция

GitHub Actions автоматически запускают тесты при:
- Push в main/master
- Pull Request

## 📝 Примеры тестов

Смотрите `tests/e2e/specs/*.spec.ts`
