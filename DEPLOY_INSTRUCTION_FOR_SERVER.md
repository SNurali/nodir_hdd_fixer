# Инструкция для деплоя на боевой сервер

## Статус проекта

**Дата:** 15 марта 2026
**Репозиторий:** https://github.com/SNurali/nodir_hdd_fixer.git
**Сайт:** http://hddfix.uz:3003/
**API:** http://hddfix.uz:3004/

### Последний коммит на GitHub
```
2e5cf68 fix: add migration to sync empty client data from users table
```

---

## ⚠️ ИСПРАВЛЕНИЯ В ЭТОЙ ВЕРСИИ

1. **NEXT_PUBLIC_API_URL** — исправлен с `localhost:3004` на `hddfix.uz:3004`
2. **Avatar upload** — добавлен volume `uploads_prod` для сохранения аватаров
3. **API URL** — исправлено удаление порта для production доменов
4. **SSR Auth** — добавлен `API_INTERNAL_URL` для серверных запросов в Docker
5. **Static uploads** — исправлена раздача статических файлов в Docker
6. **DTO Validation** — исправлена валидация nullable полей (phone, email, telegram)
7. **Frontend payloads** — добавлена валидация E.164 телефона перед отправкой
8. **Client sync** — исправлены пустые ФИО/телефон в заказе (синхронизация client record)
9. **Migration** — добавлена миграция для исправления существующих пустых данных клиентов

---

## Команды для обновления на сервере

### 1. Перейти в директорию проекта
```bash
cd /path/to/nodir_hdd_fixer
```

### 2. Остановить текущие контейнеры
```bash
docker compose -f docker-compose.prod.yml down
```

### 3. Получить последние изменения
```bash
git fetch origin
git reset --hard origin/main
```

### 4. Пересобрать и запустить (ВАЖНО: --build!)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Применить миграцию для исправления пустых данных клиентов
```bash
docker compose -f docker-compose.prod.yml exec api sh -c "node ./node_modules/typeorm/cli.js migration:run -d ./apps/api/dist/database/data-source.js"
```

### 6. Проверить здоровье сервисов
```bash
# API Health
curl http://localhost:3004/v1/health

# Frontend
curl http://localhost:3003

# Проверить что API доступен из браузера
curl http://hddfix.uz:3004/v1/health  # Должно вернуть {"status":"ok"...}
```

### 6. Проверить логи
```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## Переменные окружения (.env.prod)

Файл должен содержать:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=hdd_fixer
DB_PASSWORD=SECURE_PASSWORD
DB_DATABASE=hdd_fixer_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret

# API
APP_PORT=3004
CORS_ORIGINS=http://localhost:3003,http://hddfix.uz:3003

# Web - ВАЖНО: URL должен быть доступен из браузера!
WEB_PORT=3003
NEXT_PUBLIC_API_URL=http://hddfix.uz:3004/v1
# Для SSR запросов внутри Docker (не менять!)
API_INTERNAL_URL=http://api:3004/v1

# Uploads
UPLOADS_DIR=/app/uploads

# Telegram
TELEGRAM_BOT_TOKEN=8759863943:AAHncy4_UyPHiidyTTLp5e2F9bFJCRTYqfI
TELEGRAM_CHAT_ID=-5240393504

# Environment
NODE_ENV=production
```

---

## Порты (Docker Compose prod)

| Сервис | Внешний порт | Внутренний порт |
|--------|--------------|-----------------|
| PostgreSQL | 5436 | 5432 |
| Redis | 6380 | 6379 |
| API | 3004 | 3004 |
| Web | 3003 | 3003 |

---

## Volumes (для сохранения данных)

| Volume | Назначение |
|--------|------------|
| pgdata_prod | База данных PostgreSQL |
| redisdata_prod | Данные Redis |
| uploads_prod | Загруженные файлы (аватары) |

---

## Быстрая проверка

```bash
# Проверить статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверить логи API
docker compose -f docker-compose.prod.yml logs -f api

# Проверить логи Web
docker compose -f docker-compose.prod.yml logs -f web

# Проверить подключение к БД
docker exec hdd_fixer_postgres_prod psql -U hdd_fixer -d hdd_fixer_db -c "SELECT 1"

# Проверить Redis
docker exec hdd_fixer_redis_prod redis-cli ping

# Проверить uploads volume
docker exec hdd_fixer_api_prod ls -la /app/uploads
```

---

## Откат (если что-то пошло не так)

```bash
# Остановить всё
docker compose -f docker-compose.prod.yml down

# Вернуться к предыдущей версии
git log --oneline -5  # найти нужный коммит
git reset --hard <commit_hash>

# Пересобрать и запустить
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Контакты

- GitHub: https://github.com/SNurali/nodir_hdd_fixer
- Разработчик: @SNurali