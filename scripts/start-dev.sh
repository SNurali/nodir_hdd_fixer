#!/bin/bash
# ===========================================
# HDD Fixer - Local Development Start Script
# ===========================================
# Запускает всю локальную среду разработки:
# - Docker контейнеры (PostgreSQL, Redis)
# - Backend API (NestJS, порт 3004)
# - Frontend Web (Next.js, порт 3003)
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "============================================="
echo "  🚀 HDD Fixer - Local Development Start"
echo "============================================="
echo ""

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please update with your values if needed."
    echo ""
fi

# Шаг 1: Запуск Docker контейнеров (PostgreSQL + Redis)
echo "📦 Step 1: Starting Docker containers (PostgreSQL 16, Redis 7)..."
docker compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for databases to be ready..."
sleep 5

# Проверка здоровья PostgreSQL
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec hdd_fixer_postgres_dev pg_isready -U hdd_fixer -d hdd_fixer_db > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ PostgreSQL failed to start. Check logs: docker compose -f docker-compose.dev.yml logs postgres"
        exit 1
    fi
    echo "   Waiting for PostgreSQL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Проверка здоровья Redis
until docker exec hdd_fixer_redis_dev redis-cli ping > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Redis failed to start. Check logs: docker compose -f docker-compose.dev.yml logs redis"
        exit 1
    fi
    echo "   Waiting for Redis... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ Redis is ready"
echo ""

# Шаг 2: Применение миграций БД
echo "🔧 Step 2: Running database migrations..."
npm run db:migrate || echo "⚠️  Migrations may have already been applied"
echo ""

# Шаг 3: Сидирование БД (создание admin user)
echo "🌱 Step 3: Seeding database with test data..."
npm run db:seed || echo "⚠️  Seed may have already been applied"
echo ""

# Шаг 4: Запуск Backend API
echo "⚙️  Step 4: Starting Backend API (NestJS, port 3004)..."
echo "   Logs: docker compose -f docker-compose.dev.yml logs -f api (if using Docker)"
echo "   Or check terminal output below"
echo ""

# Шаг 5: Запуск Frontend Web
echo "🎨 Step 5: Starting Frontend Web (Next.js, port 3003)..."
echo ""

echo "============================================="
echo "  ✅ Starting all services..."
echo "============================================="
echo ""
echo "📍 Services:"
echo "   - PostgreSQL:   localhost:5432"
echo "   - Redis:        localhost:6379"
echo "   - Backend API:  http://localhost:3004"
echo "   - Frontend Web: http://localhost:3003"
echo "   - Swagger:      http://localhost:3004/api/docs"
echo ""
echo "🔧 Default Admin Credentials:"
echo "   Email:    admin@hdd-fixer.uz"
echo "   Password: admin123"
echo ""
echo "📊 Monitoring:"
echo "   - Stop all:     docker compose -f docker-compose.dev.yml down"
echo "   - View logs:    docker compose -f docker-compose.dev.yml logs -f"
echo "   - Restart:      npm run dev:all"
echo ""
echo "============================================="
echo ""

# Запуск всех сервисов через Turbo
npm run dev
