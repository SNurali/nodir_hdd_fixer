# Инструкция по обновлению и диагностике на сервере

## Проблема
Статус заказа не обновляется после завершения работы мастером.

## Решение

### 1. Обновить код на сервере
```bash
cd /path/to/nodir_hdd_fixer

# Остановить контейнеры
docker compose -f docker-compose.prod.yml down

# Обновить код
git fetch origin
git reset --hard origin/main

# Пересобрать и запустить
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Применить миграции
```bash
docker compose -f docker-compose.prod.yml exec api sh -c "node ./node_modules/typeorm/cli.js migration:run -d ./apps/api/dist/database/data-source.js"
```

### 3. Проверить версию кода
```bash
# Проверить последний коммит
git log -1 --oneline

# Должно быть: d18f932 fix: auto-update order status when all work is completed
```

### 4. Проверить логи API
```bash
docker compose -f docker-compose.prod.yml logs -f api | grep -i "complete\|status"
```

### 5. Тестирование
1. Зайти как мастер: http://hddfix.uz:3003/master/dashboard
2. Открыть заказ #125919D3
3. Нажать "Готово" для работы
4. Статус должен измениться на "Готов к выдаче"

### 6. Если статус всё равно не меняется

Проверить данные в БД:
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, status, price_approved_at, created_at 
FROM orders 
WHERE id LIKE '125919D3%';
"

docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, order_id, is_completed, completed_at 
FROM order_details 
WHERE order_id IN (SELECT id FROM orders WHERE id LIKE '125919D3%');
"
```

Проверить lifecycle:
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, order_id, action, action_type, created_at 
FROM order_lifecycle 
WHERE order_id IN (SELECT id FROM orders WHERE id LIKE '125919D3%')
ORDER BY created_at DESC
LIMIT 10;
"
```

## Ожидаемое поведение

После нажатия "Готово":
1. `order_details.is_completed = 1`
2. Если все детали выполнены → `orders.status = 'ready_for_pickup'`
3. В lifecycle добавляется запись "Все работы выполнены. Заказ готов к выдаче."

## Если проблема в кэше frontend

Очистить кэш браузера или сделать hard reload (Ctrl+Shift+R)