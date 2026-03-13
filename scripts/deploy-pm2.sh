#!/bin/bash

# ===========================================
# Скрипт обновления для PM2
# RECOVERY.UZ - PM2 Deployment Script
# ===========================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "============================================"
echo "  RECOVERY.UZ - PM2 Update"
echo "============================================"
echo ""

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 не найден. Установите: npm install -g pm2"
    exit 1
fi

# Обновление кода
log_info "Обновление кода из Git..."
git pull origin main
log_success "Код обновлён"

# Остановка процессов
log_info "Остановка PM2 процессов..."
pm2 stop all
log_success "Процессы остановлены"

# Очистка кэша
log_info "Очистка кэша..."
rm -rf apps/web/.next
rm -rf .turbo
log_success "Кэш очищен"

# Установка зависимостей
log_info "Установка зависимостей..."
npm ci --production
log_success "Зависимости установлены"

# Сборка
log_info "Сборка приложения..."
npm run build
log_success "Приложение собрано"

# Перезапуск
log_info "Перезапуск процессов..."
pm2 restart all
log_success "Процессы перезапущены"

# Статус
echo ""
log_info "Статус процессов:"
pm2 status

echo ""
log_success "============================================"
log_success "  Обновление завершено!"
log_success "============================================"
echo ""
