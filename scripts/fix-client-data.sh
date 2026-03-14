#!/bin/bash
# Скрипт для диагностики и исправления пустых данных клиентов
# Запускать на сервере: bash scripts/fix-client-data.sh

set -e

echo "=== Диагностика данных клиента для заказа #125919D3 ==="
echo ""

# Проверяем docker compose файл
COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

echo "1. Поиск заказа..."
ORDER_DATA=$(docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -t -c "
SELECT id, client_id, status, created_at 
FROM orders 
WHERE id LIKE '125919D3%'
LIMIT 1;
")

echo "$ORDER_DATA"
echo ""

# Извлекаем client_id
CLIENT_ID=$(echo "$ORDER_DATA" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -2 | tail -1)

if [ -z "$CLIENT_ID" ]; then
    echo "❌ Заказ не найден или client_id пустой!"
    exit 1
fi

echo "2. Данные клиента (client_id: $CLIENT_ID)..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, user_id, full_name, phone, email, telegram 
FROM clients 
WHERE id = '$CLIENT_ID';
"

echo ""
echo "3. Проверка связи с пользователем..."

# Получаем user_id клиента
USER_ID=$(docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -t -c "
SELECT user_id FROM clients WHERE id = '$CLIENT_ID';
" | tr -d ' ')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
    echo "⚠️  Клиент не связан с пользователем (user_id = NULL)"
    echo "Это guest клиент - данные были переданы при создании заказа, но не сохранились."
    echo ""
    echo "Возможные причины:"
    echo "1. Заказ создан до исправления синхронизации"
    echo "2. Клиент не был авторизован при создании заказа"
    echo ""
    echo "Решение: Обновите данные клиента вручную через SQL:"
    echo ""
    echo "docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c \""
    echo "UPDATE clients SET full_name = 'ИМЯ КЛИЕНТА', phone = '+998XXXXXXXXX' WHERE id = '$CLIENT_ID';"
    echo "\""
else
    echo "user_id: $USER_ID"
    echo ""
    echo "4. Данные пользователя..."
    docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
    SELECT id, full_name, phone, email 
    FROM users 
    WHERE id = '$USER_ID';
    "
    
    echo ""
    echo "5. Синхронизация данных из users в clients..."
    docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
    UPDATE clients c
    SET 
        full_name = COALESCE(NULLIF(c.full_name, ''), u.full_name),
        phone = COALESCE(NULLIF(c.phone, ''), u.phone),
        email = COALESCE(NULLIF(c.email, ''), u.email),
        telegram = COALESCE(NULLIF(c.telegram, ''), u.telegram)
    FROM users u
    WHERE c.id = '$CLIENT_ID'
    AND c.user_id = u.id;
    "
    
    echo ""
    echo "6. Проверка результата..."
    docker compose -f $COMPOSE_FILE exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
    SELECT id, user_id, full_name, phone, email, telegram 
    FROM clients 
    WHERE id = '$CLIENT_ID';
    "
fi

echo ""
echo "=== Диагностика завершена ==="