# Deployment Guide / Руководство по деплою

HDD Fixer — Service Center Management System

---

## 📋 Содержание

1. [Требования](#требования)
2. [Локальная разработка](#локальная-разработка)
3. [Деплой на продакшен](#деплой-на-продакшен)
4. [Настройка сервера](#настройка-сервера)
5. [Мониторинг и логи](#мониторинг-и-логи)
6. [Troubleshooting](#troubleshooting)

---

## Требования

### Минимальные требования
- **OS**: Linux (Ubuntu 20.04+, Debian 11+)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB free space
- **Node.js**: 20.x
- **Docker**: 24.x+
- **Docker Compose**: 2.x+

### Проверка установленных компонентов
```bash
node --version          # v20.x.x
npm --version           # 10.x.x
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version 2.x.x
```

---

## Локальная разработка

### Быстрый старт (3 команды)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/SNurali/nodir_hdd_fixer.git
cd nodir_hdd_fixer

# 2. Установить зависимости
npm install

# 3. Запустить всё
npm run dev:all
```

### Сервисы локально

| Сервис | URL | Порт |
|--------|-----|------|
| Frontend Web | http://localhost:3003 | 3003 |
| Backend API | http://localhost:3004 | 3004 |
| Swagger Docs | http://localhost:3004/api/docs | 3004 |
| PostgreSQL | localhost | 5432 |
| Redis | localhost | 6379 |

### Остановка локальной среды
```bash
# Остановить всё (Ctrl+C в терминале)
# Остановить Docker контейнеры
npm run docker:dev:down
```

---

## Деплой на продакшен

### Вариант 1: Docker Compose (рекомендуется)

```bash
# 1. Обновить код
git pull origin main

# 2. Подготовить .env.prod (на основе .env.production)
./scripts/prepare-prod-env.sh

# 3. Запустить Docker контейнеры (prod)
docker compose -f docker-compose.prod.yml up -d --build

# 4. Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

Миграции запускаются автоматически при старте API контейнера (см. `apps/api/Dockerfile`).

---

## Настройка сервера

### 1. Установка Node.js 20.x

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2. Установка Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Проверка
docker --version
docker compose version
```

### 3. Настройка окружения

```bash
# Перейти в директорию проекта
cd /path/to/nodir_hdd_fixer

# Создать .env.production (если его ещё нет)
cp .env.production.example .env.production

# Отредактировать с реальными значениями
nano .env.production

# Сгенерировать .env.prod для Docker Compose
./scripts/prepare-prod-env.sh
```

### 4. Настройка .env.production

```env
# Database
DB_HOST=localhost
DB_PORT=5436
DB_USERNAME=hdd_fixer
DB_PASSWORD=SECURE_PASSWORD_HERE
DB_DATABASE=hdd_fixer_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT (обязательно смените!)
JWT_SECRET=generate_32_random_characters_here
JWT_REFRESH_SECRET=generate_another_32_random_chars

# API
APP_PORT=3004
APP_URL=http://your-server-ip:3004
CORS_ORIGINS=http://localhost:3003,https://your-domain.com

# Web
WEB_PORT=3003
# Оставьте /v1 если nginx проксирует /v1 -> localhost:3004
NEXT_PUBLIC_API_URL=/v1

# Environment
NODE_ENV=production
```

### 5. Генерация безопасных секретов

```bash
# Сгенерировать случайную строку
openssl rand -base64 32
# или
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Первичный seed (админ + справочники)

Если база пустая, выполните seed внутри API контейнера:

```bash
docker compose -f docker-compose.prod.yml exec -T api sh -c \\
  \"DB_HOST=postgres DB_PORT=5432 DB_USERNAME=hdd_fixer DB_PASSWORD=YOUR_DB_PASSWORD DB_DATABASE=hdd_fixer_db \\
  node apps/api/dist/database/seeds/run-seed.js\"
```

---

## Мониторинг и логи

### Docker Compose логи

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только API
docker compose -f docker-compose.prod.yml logs -f api

# Только PostgreSQL
docker compose -f docker-compose.prod.yml logs -f postgres

# Только Redis
docker compose -f docker-compose.prod.yml logs -f redis
```

### Проверка здоровья сервисов

```bash
# API health check
curl http://localhost:3004/v1/health

# Web check
curl http://localhost:3003

# PostgreSQL check
docker exec hdd_fixer_postgres_prod pg_isready -U hdd_fixer -d hdd_fixer_db

# Redis check
docker exec hdd_fixer_redis_prod redis-cli ping
```

### Статус контейнеров

```bash
# Все контейнеры
docker compose -f docker-compose.prod.yml ps

# Детальная информация
docker stats
```

---

## Troubleshooting

### API не запускается (порт 3004)

```bash
# Проверить кто использует порт
lsof -i :3004

# Остановить старый процесс
kill -9 <PID>

# Или через fuser
fuser -k 3004/tcp

# Запустить снова
npm run start:api
```

### Ошибка подключения к БД

```bash
# Проверить запущен ли PostgreSQL
docker compose -f docker-compose.prod.yml ps postgres

# Проверить логи PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Проверить переменные окружения
cat .env.production | grep DB_

# Перезапустить PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

### Миграции не применяются

```bash
# Проверить подключение к БД
docker exec -it hdd_fixer_postgres_prod psql -U hdd_fixer -d hdd_fixer_db

# Применить миграции вручную из контейнера
docker exec -it hdd_fixer_api_prod sh -c "cd apps/api && npm run migration:run"

# Или локально (если БД доступна)
npm run db:migrate
```

### Redis не отвечает

```bash
# Проверить статус
docker compose -f docker-compose.prod.yml ps redis

# Проверить логи
docker compose -f docker-compose.prod.yml logs redis

# Перезапустить
docker compose -f docker-compose.prod.yml restart redis

# Проверить подключение
docker exec hdd_fixer_redis_prod redis-cli ping
```

### Очистка и полный перезапуск

```bash
# Остановить всё
docker compose -f docker-compose.prod.yml down

# Удалить volumes (осторожно: данные будут удалены!)
docker compose -f docker-compose.prod.yml down -v

# Запустить заново
docker compose -f docker-compose.prod.yml up -d

# Применить миграции
npm run db:migrate

# Засидить БД
npm run db:seed
```

### Проблемы с CORS

Если frontend не может подключиться к API:

1. Проверьте `CORS_ORIGINS` в `.env.production`
2. Убедитесь что URL frontend указан правильно
3. Перезапустите API после изменений

```env
# Правильно для продакшена
CORS_ORIGINS=http://localhost:3003,https://hdd-fixer.uz,https://www.hdd-fixer.uz
```

---

## Backup и восстановление БД

### Создание бэкапа

```bash
# Бэкап PostgreSQL
docker exec hdd_fixer_postgres_prod pg_dump -U hdd_fixer hdd_fixer_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Бэкап Redis
docker exec hdd_fixer_redis_prod redis-cli BGSAVE
cp /path/to/redisdata/dump.rdb redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

### Восстановление из бэкапа

```bash
# Восстановление PostgreSQL
cat backup_20240101_120000.sql | docker exec -i hdd_fixer_postgres_prod psql -U hdd_fixer -d hdd_fixer_db
```

---

## Обновление (Update)

```bash
# 1. Остановить текущую версию
docker compose -f docker-compose.prod.yml down

# 2. Обновить код
git pull origin main

# 3. Установить зависимости
npm install --production

# 4. Собрать
npm run build

# 5. Применить миграции
npm run db:migrate

# 6. Запустить новую версию
docker compose -f docker-compose.prod.yml up -d

# 7. Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

---

## Security Checklist

- [ ] Смените все JWT секреты на уникальные значения
- [ ] Смените пароль PostgreSQL на сложный
- [ ] Настройте firewall (UFW/iptables)
- [ ] Настройте HTTPS (Let's Encrypt)
- [ ] Отключите root login по SSH
- [ ] Настройте автоматические обновления безопасности
- [ ] Регулярно делайте бэкапы БД
- [ ] Мониторьте логи на предмет атак

---

## Контакты и поддержка

- GitHub: https://github.com/SNurali/nodir_hdd_fixer
- Документация: /docs
