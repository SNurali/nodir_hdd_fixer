#!/bin/bash
# ===========================================
# HDD Fixer - Production Deployment Script
# ===========================================
# Деплой на боевой сервер:
# - git pull
# - npm install
# - npm run build
# - Миграции БД
# - Перезапуск сервисов
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "============================================="
echo "  🚀 HDD Fixer - Production Deployment"
echo "============================================="
echo ""

# Проверка окружения
if [ "$NODE_ENV" != "production" ] && [ -z "$DEPLOY_PRODUCTION" ]; then
    echo "⚠️  WARNING: Deploying outside of production environment!"
    echo "   Set NODE_ENV=production or DEPLOY_PRODUCTION=1 to continue."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Шаг 1: Git pull
echo "📦 Step 1: Pulling latest changes from Git..."
git pull origin main || git pull origin master || echo "⚠️  Git pull failed or not a git repository"
echo ""

# Шаг 2: Установка зависимостей
echo "📦 Step 2: Installing dependencies..."
npm install --production
echo ""

# Шаг 3: Сборка проекта
echo "🔧 Step 3: Building project..."
npm run build
echo ""

# Шаг 4: Применение миграций БД
echo "🔧 Step 4: Running database migrations..."
npm run db:migrate || echo "⚠️  Migrations may have already been applied"
echo ""

# Шаг 5: Перезапуск сервисов
echo "🔄 Step 5: Restarting services..."

# Если используем Docker Compose для продакшена
if [ -f docker-compose.prod.yml ]; then
    echo "   Using Docker Compose (production)..."
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d --build
    echo "✅ Docker services restarted"
else
    # Если используем PM2
    if command -v pm2 &> /dev/null && [ -f ecosystem.config.js ]; then
        echo "   Using PM2..."
        pm2 restart all
        echo "✅ PM2 services restarted"
    # Если используем systemd
    elif systemctl is-active --quiet hdd-fixer-api 2>/dev/null; then
        echo "   Using systemd..."
        sudo systemctl restart hdd-fixer-api
        sudo systemctl restart hdd-fixer-web
        echo "✅ Systemd services restarted"
    else
        echo "⚠️  No deployment manager found (Docker Compose, PM2, or systemd)"
        echo "   Please restart services manually"
    fi
fi
echo ""

# Шаг 6: Проверка здоровья сервисов
echo "🏥 Step 6: Health check..."
sleep 5

# Проверка API
if curl -s http://localhost:3004/v1/health > /dev/null 2>&1; then
    echo "✅ Backend API is healthy"
else
    echo "⚠️  Backend API health check failed (port 3004)"
fi

# Проверка Web
if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "✅ Frontend Web is healthy"
else
    echo "⚠️  Frontend Web health check failed (port 3003)"
fi
echo ""

echo "============================================="
echo "  ✅ Deployment Complete!"
echo "============================================="
echo ""
echo "📍 Services:"
echo "   - Backend API:  http://localhost:3004"
echo "   - Frontend Web: http://localhost:3003"
echo "   - Swagger:      http://localhost:3004/api/docs"
echo ""
echo "📊 Monitoring:"
echo "   - Docker logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "   - PM2 logs:     pm2 logs"
echo "   - Systemd logs: journalctl -u hdd-fixer-api -f"
echo ""
echo "============================================="
