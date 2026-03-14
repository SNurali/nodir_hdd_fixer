# Диагностика и исправление пустых данных клиента

## Проблема
В заказе #125919D3 пустые ФИО и телефон клиента.

## Возможные причины

1. **Guest клиент** - заказ создан неавторизованным пользователем, данные не сохранились
2. **Google OAuth** - клиент зарегистрирован через Google без телефона
3. **Баг синхронизации** - заказ создан до исправления

## Диагностика

### Шаг 1: Проверить данные заказа
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, client_id, status, created_at FROM orders WHERE id LIKE '125919D3%';
"
```

### Шаг 2: Проверить данные клиента
```bash
# Замени <CLIENT_ID> на значение из шага 1
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, user_id, full_name, phone, email FROM clients WHERE id = '<CLIENT_ID>';
"
```

### Шаг 3: Если user_id есть - проверить пользователя
```bash
# Замени <USER_ID> на значение из шага 2
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT id, full_name, phone, email FROM users WHERE id = '<USER_ID>';
"
```

## Исправление

### Вариант A: Если user_id есть и данные в users заполнены
```bash
# Синхронизировать данные из users в clients
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
UPDATE clients c
SET 
    full_name = COALESCE(NULLIF(c.full_name, ''), u.full_name),
    phone = COALESCE(NULLIF(c.phone, ''), u.phone),
    email = COALESCE(NULLIF(c.email, ''), u.email)
FROM users u
WHERE c.user_id = u.id
AND (c.full_name IS NULL OR c.full_name = '' OR c.phone IS NULL OR c.phone = '');
"
```

### Вариант B: Если user_id NULL (guest клиент)
Данные потеряны. Нужно обновить вручную:
```bash
# Замени <CLIENT_ID> и данные
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
UPDATE clients SET full_name = 'Имя Клиента', phone = '+998901234567' WHERE id = '<CLIENT_ID>';
"
```

### Вариант C: Массовое исправление всех пустых клиентов
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
UPDATE clients c
SET 
    full_name = COALESCE(NULLIF(c.full_name, ''), u.full_name),
    phone = COALESCE(NULLIF(c.phone, ''), u.phone),
    email = COALESCE(NULLIF(c.email, ''), u.email),
    telegram = COALESCE(NULLIF(c.telegram, ''), u.telegram)
FROM users u
WHERE c.user_id = u.id
AND (c.full_name IS NULL OR c.full_name = '' OR c.phone IS NULL OR c.phone = '');
"
```

## Проверка результата
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U hdd_fixer -d hdd_fixer_db -c "
SELECT o.id as order_id, c.full_name, c.phone 
FROM orders o 
JOIN clients c ON o.client_id = c.id 
WHERE o.id LIKE '125919D3%';
"
```