# HDD Fixer — Service Center Management System

Информационная система сервисного центра для приёма и управления заказами на ремонт оборудования.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm/yarn

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migrations & Seed
```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

- **API**: http://localhost:3004
- **Swagger Docs**: http://localhost:3004/api/docs
- **Web App**: http://localhost:3003

### Default Admin Credentials
- Email: `admin@hdd-fixer.uz`
- Password: `admin123`

## 📁 Project Structure

```
├── apps/
│   ├── api/         # NestJS Backend (REST API)
│   └── web/         # Next.js Frontend
├── packages/
│   └── shared/      # Shared types, DTOs, enums
├── docs/            # Documentation
└── docker-compose.yml
```

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
| Testing | Vitest + ESLint + production build checks |
| Frontend | Next.js 16 + Tailwind CSS |

## 🧪 Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e --workspace=apps/api
```

### Current Quality Gates
- `npm run lint`
- `npm run test`
- `npm run build`

## 🌍 Supported Languages
- Русский (ru)
- Ўзбекча (uz-cyr)
- O'zbekcha (uz-lat)
- English (en)

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

## 🔐 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5436
DB_USERNAME=hdd_fixer
DB_PASSWORD=hdd_fixer_secret
DB_DATABASE=hdd_fixer_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# API
APP_PORT=3004

# Web
WEB_PORT=3003
NEXT_PUBLIC_API_URL=http://localhost:3004/v1

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all apps |
| `npm run test` | Run unit tests |
| `npm run test --workspace=apps/api` | Run backend unit tests directly |
| `npm run test:coverage --workspace=apps/api` | Run backend coverage |
| `npm run lint` | Run linter |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |

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

## ⚠️ Current Scope Notes

- OAuth login is not wired in the current UI/API flow.
- Email/SMS/Push/Telegram providers are scaffolded, but production adapters still need configuration.
- Frontend UI tests are not added yet; current verification relies on lint, unit tests for API, and production build.

## 📄 License

Private - All rights reserved
