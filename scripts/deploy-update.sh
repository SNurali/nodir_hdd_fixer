#!/bin/bash

# ===========================================
# Скрипт обновления боевого сервера
# RECOVERY.UZ - Deployment Update Script
# ===========================================

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Без цвета

# Логирование
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка наличия Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker не найден. Установите Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose не найден. Установите Docker Compose."
        exit 1
    fi
}

# Остановка сервиса
stop_service() {
    log_info "Остановка сервиса..."
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml down
    elif [ -f "docker-compose.yml" ]; then
        docker compose down
    else
        log_error "docker-compose файл не найден"
        exit 1
    fi
    
    log_success "Сервис остановлен"
}

# Очистка кэша
clean_cache() {
    log_info "Очистка кэша..."
    
    # Очистка кэша Next.js
    if [ -d "apps/web/.next" ]; then
        rm -rf apps/web/.next
        log_info "Next.js кэш очищен"
    fi
    
    # Очистка кэша node_modules
    if [ -d "apps/web/node_modules/.cache" ]; then
        rm -rf apps/web/node_modules/.cache
        log_info "Node modules кэш очищен"
    fi
    
    # Очистка кэша Turbo
    if [ -d ".turbo" ]; then
        rm -rf .turbo
        log_info "Turbo кэш очищен"
    fi
    
    log_success "Кэш очищен"
}

# Обновление кода
update_code() {
    log_info "Обновление кода из Git..."
    
    git fetch origin main
    
    if ! git diff --quiet HEAD origin/main; then
        git pull origin main
        log_success "Код обновлён"
    else
        log_info "Код актуален"
    fi
}

# Установка зависимостей
install_deps() {
    log_info "Установка зависимостей..."
    npm ci --production
    log_success "Зависимости установлены"
}

# Сборка приложения
build_app() {
    log_info "Сборка приложения..."
    npm run build
    log_success "Приложение собрано"
}

# Запуск сервиса
start_service() {
    log_info "Запуск сервиса..."
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml up -d
    elif [ -f "docker-compose.yml" ]; then
        docker compose up -d
    else
        log_error "docker-compose файл не найден"
        exit 1
    fi
    
    log_success "Сервис запущен"
}

# Проверка статуса
check_status() {
    log_info "Проверка статуса сервиса..."
    sleep 5
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml ps
    elif [ -f "docker-compose.yml" ]; then
        docker compose ps
    fi
    
    log_success "Готово!"
}

# Показ логов
show_logs() {
    log_info "Последние логи (нажмите Ctrl+C для выхода)..."
    sleep 2
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml logs -f --tail=50
    elif [ -f "docker-compose.yml" ]; then
        docker compose logs -f --tail=50
    fi
}

# Основная функция
main() {
    echo ""
    echo "============================================"
    echo "  RECOVERY.UZ - Обновление сервера"
    echo "============================================"
    echo ""
    
    # Проверка Docker
    check_docker
    
    # Обновление кода
    update_code
    
    # Остановка сервиса
    stop_service
    
    # Очистка кэша
    clean_cache
    
    # Установка зависимостей
    install_deps
    
    # Сборка приложения
    build_app
    
    # Запуск сервиса
    start_service
    
    # Проверка статуса
    check_status
    
    echo ""
    log_success "============================================"
    log_success "  Обновление завершено успешно!"
    log_success "============================================"
    echo ""
    
    # Предложение посмотреть логи
    read -p "Показать логи сервиса? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Запуск
main "$@"
