# Инструкция для деплоя на боевой сервер

## Статус проекта

**Дата:** 15 марта 2026
**Репозиторий:** https://github.com/SNurali/nodir_hdd_fixer.git
**Сайт:** http://hddfix.uz:3003/
**API:** http://hddfix.uz:3004/

### Текущее состояние на сервере
- ✅ Frontend работает: http://hddfix.uz:3003/
- ✅ Backend API работает: http://hddfix.uz:3004/v1/health
- ✅ Swagger доступен: http://hddfix.uz:3004/api/docs

### Последний коммит на GitHub
```
e6703ca feat: add migration for comments translations in order_lifecycle
```

---

## Команды для обновления на сервере

### 1. Перейти в директорию проекта
```bash
cd /path/to/nodir_hdd_fixer
```

### 2. Остановить текущие контейнеры (если используются)
```bash
docker compose -f docker-compose.prod.yml down
```

### 3. Получить последние изменения
```bash
git fetch origin
git reset --hard origin/main
```

### 4. Установить зависимости и собрать
```bash
npm ci
npm run build
```

### 5. Применить новую миграцию (ВАЖНО!)
```bash
# Если используете Docker:
docker compose -f docker-compose.prod.yml up -d postgres redis
sleep 5
npm run db:migrate

# Или внутри контейнера API:
docker compose -f docker-compose.prod.yml exec api sh -c "node ./node_modules/typeorm/cli.js migration:run -d ./apps/api/dist/database/data-source.js"
```

### 6. Запустить контейнеры
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 7. Проверить здоровье сервисов
```bash
# API Health
curl http://localhost:3004/v1/health

# Frontend
curl http://localhost:3003

# Логи
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

# Web
WEB_PORT=3003
NEXT_PUBLIC_API_URL=http://hddfix.uz:3004/v1

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
npm ci && npm run build
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Контакты

- GitHub: https://github.com/SNurali/nodir_hdd_fixer
- Разработчик: @SNurali