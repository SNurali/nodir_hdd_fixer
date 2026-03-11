# 🔄 Local ↔ Production Sync Guide

## Цель
Настроить синхронизацию между локальной разработкой и боевым сервером чтобы избежать ручных настроек при каждом деплое.

---

## 📋 Структура окружений

```
┌─────────────────────────────────────────────────────────────┐
│  Локальная разработка          │  Production (Боевой)       │
├─────────────────────────────────────────────────────────────┤
│  .env.local                    │  .env.production           │
│  http://localhost:3003         │  http://arendator.uz:3003  │
│  http://localhost:3004         │  http://arendator.uz:3004  │
│  Docker: PostgreSQL, Redis     │  Docker: PostgreSQL, Redis │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Быстрый старт

### Локальная разработка (3 команды)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/SNurali/nodir_hdd_fixer.git
cd nodir_hdd_fixer

# 2. Скопировать .env.example в .env.local
cp .env.example .env.local

# 3. Запустить всё одной командой
npm run dev:all
```

**Всё!** Сервисы запустятся автоматически:
- ✅ PostgreSQL (порт 5436)
- ✅ Redis (порт 6380)
- ✅ Backend API (порт 3004)
- ✅ Frontend Web (порт 3003)

---

### Деплой на сервер (3 команды)

```bash
# 1. Зайти на сервер
ssh user@arendator.uz

# 2. Перейти в директорию проекта
cd /home/yoyo/nodir_hdd_fixer

# 3. Запустить деплой
npm run start:prod
```

Или вручную:
```bash
git pull
npm install --production
npm run build
npm run db:migrate
./scripts/deploy.sh
```

---

## 📁 Файлы окружения

| Файл | Назначение | В Git? |
|------|------------|--------|
| `.env.example` | Шаблон переменных | ✅ Да |
| `.env.local` | Локальная разработка | ❌ Нет |
| `.env.production` | Боевой сервер | ❌ Нет |
| `.env` | Активный .env (копия) | ❌ Нет |

### Как создать .env для локальной разработки:

```bash
cp .env.example .env.local
# Отредактируйте .env.local при необходимости
```

### Как создать .env для production:

```bash
cp .env.example .env.production
# Отредактируйте .env.production с production значениями
# Особенно JWT_SECRET и другие секреты!
```

---

## 🔧 Доступные команды

### Разработка
```bash
npm run dev:all        # Запустить всё (Docker + API + Web)
npm run dev:api        # Только API
npm run dev:web        # Только Web
npm run db:init        # Инициализировать БД (Docker + миграции + seed)
npm run db:migrate     # Запустить миграции
npm run db:seed        # Запустить seed данные
```

### Production
```bash
npm run start:prod     # Деплой на сервер
npm run build          # Собрать проект
npm run build:api      # Собрать только API
npm run build:web      # Собрать только Web
```

---

## 🐳 Docker контейнеры

### Запуск
```bash
docker compose up -d
```

### Остановка
```bash
docker compose down
```

### Просмотр логов
```bash
docker compose logs -f postgres
docker compose logs -f redis
```

### Порты
| Сервис | Контейнер | Хост |
|--------|-----------|------|
| PostgreSQL | 5432 | 5436 |
| Redis | 6379 | 6380 |

---

## 🔄 Синхронизация изменений

### Из локальной в production:

```bash
# 1. Закоммитить изменения
git add .
git commit -m "feature: description"
git push origin main

# 2. Зайти на сервер и обновить
ssh user@arendator.uz
cd /home/yoyo/nodir_hdd_fixer
npm run start:prod
```

### Из production в локальную (если были изменения на сервере):

```bash
# 1. Закоммитить изменения на сервере
cd /home/yoyo/nodir_hdd_fixer
git add .
git commit -m "fix: server changes"
git push origin main

# 2. Забрать локально
git pull origin main
```

---

## 🔐 Секреты и безопасность

### Никогда не коммитьте в Git:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `logs/*.log`
- ❌ `uploads/*`

### Сгенерировать JWT секрет:
```bash
openssl rand -base64 32
```

### Обновить JWT секреты на сервере:
```bash
# 1. Сгенерировать новый секрет
openssl rand -base64 32

# 2. Обновить .env.production
nano .env.production

# 3. Перезапустить сервер
npm run start:prod
```

---

## 🛠️ Решение проблем

### Порт уже занят
```bash
# Найти процесс на порту
lsof -i :3004

# Убить процесс
kill -9 <PID>
```

### Docker контейнер не запускается
```bash
# Пересоздать контейнеры
docker compose down -v
docker compose up -d
```

### Миграции не применяются
```bash
# Применить вручную
npm run db:migrate

# Или через Docker
docker exec hdd_fixer_postgres psql -U hdd_fixer -d hdd_fixer_db -c "SELECT * FROM migrations;"
```

### Логи
```bash
# API логи
tail -f logs/api.log

# Web логи
tail -f logs/web.log

# Docker логи
docker compose logs -f
```

---

## 📊 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    http://localhost:3003                    │
│                   (Next.js 16, React 19)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│                    http://localhost:3004                    │
│                  (NestJS, TypeORM, Prisma)                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      PostgreSQL 16      │     │        Redis 7          │
│        порт 5436        │     │       порт 6380         │
│    (Docker контейнер)   │     │    (Docker контейнер)   │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 📞 Контакты

При проблемах с синхронизацией:
1. Проверьте `.env.local` и `.env.production` на идентичность структуры
2. Убедитесь что Docker контейнеры запущены
3. Проверьте логи: `logs/api.log`, `logs/web.log`
