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

- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **Web App**: http://localhost:3000 (after web setup)

### Default Admin Credentials
- Email: `admin@hdd-fixer.uz`
- Password: `admin123`

## 📁 Project Structure

```
├── apps/
│   ├── api/         # NestJS Backend (REST API)
│   ├── web/         # Next.js Frontend (TODO)
│   └── mobile/      # React Native App (TODO)
├── packages/
│   └── shared/      # Shared types, DTOs, enums
└── docker-compose.yml
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 (BullMQ) |
| ORM | TypeORM |
| Auth | JWT + OAuth2 |
| Validation | Zod |
| Monorepo | Turborepo |

## 🌍 Supported Languages
- Русский (ru)
- Ўзбекча (uz-cyr)
- O'zbekcha (uz-lat)
- English (en)

## 📝 API Overview

| Module | Endpoints |
|--------|-----------|
| Auth | Register, Login, Refresh |
| Users | CRUD, Masters list |
| Clients | CRUD, Search |
| Orders | Full lifecycle (create → close) |
| Payments | Multi-currency payments |
| Notifications | Push/SMS/Email queue |
| Reference Data | Equipments, Services, Issues |
