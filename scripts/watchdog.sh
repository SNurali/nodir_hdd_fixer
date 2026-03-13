#!/bin/bash

# ===========================================
# RECOVERY.UZ - Watchdog Script
# Умный мониторинг и авто-восстановление
# ===========================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
API_URL="http://localhost:3004"
LOG_FILE="/var/log/nodir_hdd_fixer/watchdog.log"
HEALTH_CHECK_INTERVAL=60  # секунд
RESTART_THRESHOLD=3  # перезапусков за 5 минут

# Счётчик перезапусков
RESTART_COUNT=0
LAST_RESTART_TIME=0

# Логирование
log() {
    local message="$1"
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE" 2>/dev/null || echo "$message"
}

send_telegram() {
    local message="$1"
    if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
            -H "Content-Type: application/json" \
            -d "{
                \"chat_id\": \"${CHAT_ID}\",
                \"text\": \"${message}\",
                \"parse_mode\": \"HTML\"
            }" > /dev/null
    fi
}

# Проверка API
check_api() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/v1/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Проверка PostgreSQL
check_postgres() {
    # Check if running in Docker
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "postgres"; then
        return 0  # Docker container is running
    fi
    # Otherwise check directly
    pg_isready -h localhost -p 5436 -t 2 > /dev/null 2>&1
}

# Проверка Redis
check_redis() {
    # Check if running in Docker
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "redis"; then
        return 0  # Docker container is running
    fi
    # Otherwise check directly
    redis-cli -p 6380 ping > /dev/null 2>&1
}

# Проверка Docker контейнеров
check_docker() {
    docker ps --format "{{.Names}}" 2>/dev/null | grep -q "nodir"
}

# Перезапуск сервиса
restart_service() {
    local current_time=$(date +%s)
    local time_diff=$((current_time - LAST_RESTART_TIME))
    
    # Сброс счётчика если прошло больше 5 минут
    if [ $time_diff -gt 300 ]; then
        RESTART_COUNT=0
    fi
    
    # Проверка порога
    if [ $RESTART_COUNT -ge $RESTART_THRESHOLD ]; then
        log "${RED}❌ Превышен лимит перезапусков! Требуется вмешательство${NC}"
        send_telegram "❌ <b>КРИТИЧЕСКАЯ ОШИБКА</b>

🔧 <b>Сервис:</b> API Server
🔥 <b>Проблема:</b> Превышен лимит авто-перезапусков (${RESTART_THRESHOLD})
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')
⚠️ <b>Требуется ручное вмешательство!</b>"
        return 1
    fi
    
    RESTART_COUNT=$((RESTART_COUNT + 1))
    LAST_RESTART_TIME=$current_time
    
    log "${YELLOW}🔄 Перезапуск сервиса (попытка ${RESTART_COUNT}/${RESTART_THRESHOLD})...${NC}"
    
    # Попытка перезапуска
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "nodir"; then
        docker compose -f docker-compose.prod.yml restart api
        log "${GREEN}✅ Docker контейнер перезапущен${NC}"
    elif command -v pm2 &> /dev/null; then
        pm2 restart all
        log "${GREEN}✅ PM2 процессы перезапущены${NC}"
    else
        log "${RED}❌ Не удалось определить систему управления${NC}"
        return 1
    fi
    
    send_telegram "🔄 <b>АВТО-ПЕРЕЗАПУСК</b>

🔧 <b>Сервис:</b> API Server
📊 <b>Попытка:</b> ${RESTART_COUNT}/${RESTART_THRESHOLD}
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')
✅ <b>Перезапуск выполнен!</b>"
    
    return 0
}

# Проверка ресурсов
check_resources() {
    # CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > 90" | bc -l 2>/dev/null || echo 0) )); then
        log "${YELLOW}⚠️ Высокая загрузка CPU: ${cpu_usage}%${NC}"
        send_telegram "⚠️ <b>ВЫСОКАЯ НАГРУЗКА</b>

📊 <b>CPU:</b> ${cpu_usage}%
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')
⚠️ <b>Рекомендуется проверка!</b>"
    fi
    
    # RAM
    local mem_info=$(free | grep Mem)
    local mem_total=$(echo $mem_info | awk '{print $2}')
    local mem_used=$(echo $mem_info | awk '{print $3}')
    local mem_percent=$((mem_used * 100 / mem_total))
    
    if [ $mem_percent -gt 90 ]; then
        log "${YELLOW}⚠️ Высокая загрузка RAM: ${mem_percent}%${NC}"
        send_telegram "⚠️ <b>ВЫСОКАЯ НАГРУЗКА</b>

📊 <b>RAM:</b> ${mem_percent}%
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')
⚠️ <b>Рекомендуется проверка!</b>"
    fi
    
    # Disk
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ $disk_usage -gt 90 ]; then
        log "${YELLOW}⚠️ Критическое место на диске: ${disk_usage}%${NC}"
        send_telegram "⚠️ <b>ДИСК ЗАПОЛНЕН</b>

💾 <b>Место:</b> ${disk_usage}%
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')
🔥 <b>Критично! Освободите место!</b>"
    fi
}

# Основной цикл
main() {
    log "${BLUE}========================================${NC}"
    log "${BLUE}🐕 RECOVERY.UZ Watchdog запущен${NC}"
    log "${BLUE}========================================${NC}"
    
    send_telegram "🐕 <b>WATCHDOG ЗАПУЩЕН</b>

✅ <b>Мониторинг активирован</b>
⏱ <b>Интервал:</b> ${HEALTH_CHECK_INTERVAL}с
🔧 <b>Сервисы:</b> API, PostgreSQL, Redis
⏰ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')"

    while true; do
        local issues=0
        
        # Проверка API
        if ! check_api; then
            log "${RED}❌ API недоступен${NC}"
            issues=$((issues + 1))
        fi
        
        # Проверка PostgreSQL
        if ! check_postgres; then
            log "${RED}❌ PostgreSQL недоступен${NC}"
            issues=$((issues + 1))
        fi
        
        # Проверка Redis
        if ! check_redis; then
            log "${RED}❌ Redis недоступен${NC}"
            issues=$((issues + 1))
        fi
        
        # Действия при проблемах
        if [ $issues -gt 0 ]; then
            log "${YELLOW}⚠️ Обнаружено проблем: ${issues}${NC}"
            restart_service
        else
            log "${GREEN}✅ Все сервисы работают нормально${NC}"
        fi
        
        # Проверка ресурсов каждый 5-й цикл
        if [ $((RANDOM % 5)) -eq 0 ]; then
            check_resources
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Запуск
main "$@"
