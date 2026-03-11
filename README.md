# HDD Fixer — Service Center Management System

Информационная система сервисного центра для приёма и управления заказами на ремонт оборудования.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (`node --version`)
- Docker & Docker Compose (`docker --version`, `docker compose version`)
- npm (`npm --version`)

### Локальная разработка (3 команды)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/SNurali/nodir_hdd_fixer.git
cd nodir_hdd_fixer

# 2. Установить зависимости
npm install

# 3. Запустить всё (Docker + Backend + Frontend)
npm run dev:all
```

**Готово!** Сервисы доступны:
- **Frontend Web**: http://localhost:3003
- **Backend API**: http://localhost:3004
- **Swagger Docs**: http://localhost:3004/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Default Admin Credentials
- Email: `admin@hdd-fixer.uz`
- Password: `admin123`

---

## 📁 Project Structure

```
nodir_hdd_fixer/
├── apps/
│   ├── api/              # NestJS Backend (REST API, порт 3004)
│   └── web/              # Next.js Frontend (порт 3003)
├── packages/
│   └── shared/           # Shared types, DTOs, enums
├── scripts/
│   ├── start-dev.sh      # Запуск локальной среды
│   ├── deploy.sh         # Деплой на продакшен
│   └── init-db.sh        # Инициализация БД
├── docker-compose.yml    # PostgreSQL + Redis (продакшен порты)
├── docker-compose.dev.yml# PostgreSQL + Redis (dev порты)
├── docker-compose.prod.yml# Full production stack
├── .env                  # Локальные переменные (не в git)
├── .env.example          # Шаблон переменных
└── package.json          # Monorepo с Turbo
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 (BullMQ) |
| ORM | TypeORM |
| Auth | JWT + httpOnly cookies + password reset |
| Validation | Zod |
| Monorepo | Turborepo |
| Testing | Vitest + ESLint + production build |
| Frontend | Next.js 16 + Tailwind CSS |
| Containerization | Docker & Docker Compose |

---

## 🧪 Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Regression Tests
```bash
npm run test:regression
```

### Current Quality Gates
- `npm run lint` — ESLint проверка
- `npm run test` — Unit тесты
- `npm run build` — Production сборка

---

## 🌍 Supported Languages
- Русский (ru)
- Ўзбекча (uz-cyr)
- O'zbekcha (uz-lat)
- English (en)

---

## 📝 API Overview

| Module | Endpoints |
|--------|-----------|
| Auth | Register, Login, Refresh, Password Reset |
| Users | CRUD, Masters list, Avatar upload |
| Roles | CRUD |
| Clients | CRUD, Search |
| Orders | Full lifecycle (create → close) |
| Payments | Payment records + Click/PayMe webhook scaffolding |
| Messages | Real-time chat |
| Notifications | In-app notifications + external provider scaffolding |
| Reference Data | Equipments, Services, Issues |
| Health | Health checks |

---

## 🔐 Environment Variables

### Локальная разработка (.env)
```env
# Database (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=hdd_fixer
DB_PASSWORD=hdd_fixer_secret
DB_DATABASE=hdd_fixer_db

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# API
APP_PORT=3004
APP_URL=http://localhost:3004

# Web
WEB_PORT=3003
NEXT_PUBLIC_API_URL=http://localhost:3004/v1
```

### Продакшен (.env.production)
Скопируйте `.env.production.example` в `.env.production` и заполните реальными значениями.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | **Запуск всей локальной среды** (Docker + API + Web) |
| `npm run dev` | Запуск всех apps в dev режиме (через Turbo) |
| `npm run dev:api` | Запуск только API |
| `npm run dev:web` | Запуск только Web |
| `npm run build` | Сборка всех apps |
| `npm run start:prod` | **Деплой на продакшен** |
| `npm run test` | Запуск unit тестов |
| `npm run test:e2e` | Запуск E2E тестов |
| `npm run lint` | Запуск линтера |
| `npm run db:migrate` | Применение миграций БД |
| `npm run db:seed` | Сидирование БД |
| `npm run db:init` | Миграции + Сидирование |
| `npm run docker:up` | Запуск Docker (PostgreSQL + Redis) |
| `npm run docker:down` | Остановка Docker |
| `npm run docker:dev:up` | Запуск Docker для разработки |
| `npm run docker:prod:up` | Запуск Docker для продакшена |
| `npm run deploy` | Запуск скрипта деплоя |

---

## 🎯 Features

### User Roles
- **Admin** - Full system access
- **Operator** - Order management, client communication
- **Master** - Task execution, diagnostics
- **Client** - Order tracking, payments

### Order Lifecycle
1. **New** - Order created
2. **Assigned** - Master assigned
3. **Diagnosing** - In progress
4. **Awaiting Approval** - Price pending client approval
5. **Approved** - Price approved
6. **In Repair** - Work in progress
7. **Ready for Pickup** - Completed
8. **Issued** - Delivered to client

### Payment Methods
- Cash
- Click
- PayMe

---

## 🔄 Local vs Production Parity

| Component | Local (dev) | Production |
|-----------|-------------|------------|
| PostgreSQL | 16 (port 5432) | 16 (port 5436) |
| Redis | 7 (port 6379) | 7 (port 6380) |
| API Port | 3004 | 3004 |
| Web Port | 3003 | 3003 |
| Node.js | 20.x | 20.x |
| Database Schema | Identical | Identical |
| Environment Variables | .env | .env.production |

---

## ⚠️ Current Scope Notes

- OAuth login is not wired in the current UI/API flow.
- Email/SMS/Push/Telegram providers are scaffolded, but production adapters still need configuration.
- Frontend UI tests are not added yet; current verification relies on lint, unit tests for API, and production build.

---

## 📄 License

Private - All rights reserved

---

## 🆘 Troubleshooting

### Docker контейнеры не запускаются
```bash
# Проверить логи
docker compose -f docker-compose.dev.yml logs

# Пересоздать контейнеры
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Порты заняты
```bash
# Проверить кто использует порт
lsof -i :5432
lsof -i :6379
lsof -i :3004
lsof -i :3003

# Остановить Docker контейнеры
npm run docker:down
```

### Миграции не применяются
```bash
# Применить вручную
npm run db:migrate

# Проверить подключение к БД
docker exec -it hdd_fixer_postgres_dev psql -U hdd_fixer -d hdd_fixer_db
```
