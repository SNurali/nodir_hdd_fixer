# 🛡️ УМНЫЙ СЕРВЕР RECOVERY.UZ

## Полная система мониторинга и авто-восстановления

---

## 🎯 Возможности

### 1. Мониторинг в реальном времени

**Ресурсы сервера:**
- ✅ CPU загрузка (%)
- ✅ Оперативная память (MB/GB)
- ✅ Дисковое пространство (GB)
- ✅ Сетевой трафик (MB)

**Сервисы:**
- ✅ API Server (NestJS)
- ✅ PostgreSQL (Database)
- ✅ Redis (Cache)
- ✅ Docker контейнеры

### 2. Health Checks

**Автоматическая проверка:**
- API доступен (HTTP 200)
- PostgreSQL подключён (pg_isready)
- Redis отвечает (PING/PONG)

**Интервал:** 60 секунд

### 3. Авто-восстановление

**При падении сервиса:**
1. Обнаружение проблемы
2. Telegram уведомление
3. Попытка авто-перезапуска
4. Проверка успеха
5. Повтор при неудаче (макс. 3 попытки)

**Защита от цикла перезапусков:**
- Максимум 3 перезапуска за 5 минут
- Превышение → Telegram алерт

### 4. Умное логирование

**Уровни ошибок:**
- `error` — обычная ошибка
- `critical` — критическая ошибка → Telegram
- `fatal` — фатальная → Telegram + авто-восстановление

**История:** 100 последних ошибок

### 5. Telegram уведомления

**События:**
- 🚀 Начало деплоя
- ✅ Завершение деплоя
- ❌ Ошибка деплоя
- 🔴 Ошибка сервиса
- 🔄 Авто-перезапуск
- ⚠️ Высокая нагрузка (CPU/RAM/Disk >90%)

---

## 📊 Dashboard

**URL:** `https://hdd-fixer.uz/admin/monitoring`

**Разделы:**

### Health Status
- API Server (Online/Offline + Uptime)
- PostgreSQL (Online/Offline + Response Time)
- Redis (Online/Offline + Response Time)
- Общий статус (Healthy/Degraded/Down)

### Resources
- CPU: загрузка %, ядра, модель
- RAM: использовано/всего MB, %
- Disk: использовано/всего GB, %, свободно
- Network: входящий/исходящий трафик MB

### Services
- Список всех сервисов
- Статус (running/stopped/error)
- PID, память, CPU

### Quick Actions
- 🔄 Перезапустить API
- 📋 Просмотр логов
- 🔍 Диагностика

---

## 🔧 Скрипты

### 1. Watchdog (`scripts/watchdog.sh`)

**Запуск:**
```bash
chmod +x scripts/watchdog.sh

# В фоновом режиме
nohup ./scripts/watchdog.sh > /var/log/nodir_hdd_fixer/watchdog.log 2>&1 &

# Или через systemd
sudo systemctl enable watchdog
sudo systemctl start watchdog
```

**Функции:**
- Проверка API каждые 60 сек
- Проверка PostgreSQL
- Проверка Redis
- Авто-перезапуск при падении
- Проверка ресурсов (каждые 5 циклов)
- Telegram уведомления

### 2. Deploy Update (`scripts/deploy-update.sh`)

**Запуск:**
```bash
./scripts/deploy-update.sh
```

**Уведомления:**
- Начало деплоя
- Успешное завершение
- Ошибка с деталями

### 3. Test Telegram (`scripts/test-telegram-full.sh`)

**Тестирование:**
```bash
./scripts/test-telegram-full.sh
```

**Проверка:**
- Уведомление о деплое
- Уведомление о заказе
- Уведомление об ошибке

---

## 📁 API Endpoints

### Monitoring

```
GET /v1/monitoring/health
```
Проверка здоровья всех сервисов

```
GET /v1/monitoring/resources
```
Ресурсы сервера (CPU, RAM, Disk, Network)

```
GET /v1/monitoring/uptime
```
Uptime API и системы

```
GET /v1/monitoring/services
```
Статус всех сервисов

```
GET /v1/monitoring/logs/recent
```
Последние логи (50 записей)

```
GET /v1/monitoring/metrics
```
Prometheus метрики

---

## 🚀 Активация на сервере

### 1. Обновление

```bash
cd /home/mrnurali/nodir_hdd_fixer
git pull origin main
./scripts/deploy-update.sh
```

### 2. Запуск Watchdog

```bash
# Создать директорию для логов
sudo mkdir -p /var/log/nodir_hdd_fixer
sudo chown $USER:$USER /var/log/nodir_hdd_fixer

# Запустить watchdog
chmod +x scripts/watchdog.sh
nohup ./scripts/watchdog.sh > /var/log/nodir_hdd_fixer/watchdog.log 2>&1 &

# Проверить
ps aux | grep watchdog
```

### 3. Проверка Dashboard

Откройте: `https://hdd-fixer.uz/admin/monitoring`

---

## 📊 Примеры Telegram уведомлений

### 🚀 Начало деплоя
```
🚀 НАЧАЛО ДЕПЛОЯ

📦 Версия: da0277f
📝 Коммит: умный сервер с мониторингом
⏱ Время: 14.03.2026 00:30

⚙️ Идёт обновление...
```

### ✅ Завершение деплоя
```
✅ ДЕПЛОЙ ЗАВЕРШЁН

📦 Версия: da0277f
📝 Коммит: умный сервер с мониторингом
⏱ Время: 14.03.2026 00:32
⏲ Длительность: 125с

🎉 Обновление успешно!
```

### 🔴 Ошибка сервиса
```
🔴 ОШИБКА СЕРВЕРА

📝 Сообщение: API health check failed
🔧 Сервис: API Server
📊 Уровень: CRITICAL
⏰ Время: 14.03.2026 00:45
🆔 PID: 12345

⚠️ Требуется внимание!
```

### 🔄 Авто-перезапуск
```
🔄 АВТО-ПЕРЕЗАПУСК

🔧 Сервис: API Server
📊 Попытка: 1/3
⏰ Время: 14.03.2026 00:46
✅ Перезапуск выполнен!
```

### ⚠️ Высокая нагрузка
```
⚠️ ВЫСОКАЯ НАГРУЗКА

📊 CPU: 95%
⏰ Время: 14.03.2026 01:00
⚠️ Рекомендуется проверка!
```

---

## 🛡️ Защита

### От чего защищает:

✅ Падение API сервера  
✅ Падение PostgreSQL  
✅ Падение Redis  
✅ Утечки памяти  
✅ Переполнение диска  
✅ Высокая нагрузка CPU  

### Как защищает:

🔍 Постоянный мониторинг  
📊 Health checks каждые 60 сек  
🔄 Авто-перезапуск сервисов  
📱 Мгновенные уведомления  
📝 Детальное логирование  
⚡ Быстрое восстановление  

---

## 📈 Метрики

| Метрика | Значение |
|---------|----------|
| Время обнаружения | <60 сек |
| Время восстановления | <30 сек |
| Макс. перезапусков | 3 за 5 мин |
| Интервал проверки | 60 сек |
| История ошибок | 100 записей |
| Uptime target | 99.9% |

---

## 🆘 Troubleshooting

### Watchdog не запускается

```bash
# Проверить права
chmod +x scripts/watchdog.sh

# Проверить логи
tail -f /var/log/nodir_hdd_fixer/watchdog.log
```

### Dashboard не открывается

```bash
# Проверить API
curl http://localhost:3004/v1/monitoring/health

# Перезапустить API
docker compose -f docker-compose.prod.yml restart api
```

### Telegram не отправляет

```bash
# Проверить токен
curl https://api.telegram.org/bot<ТОКЕН>/getMe

# Проверить Chat ID
./scripts/get-chat-id.sh
```

### Высокая нагрузка

```bash
# Проверить процессы
top

# Проверить память
free -h

# Проверить диск
df -h

# Проверить логи
tail -100 /var/log/nodir_hdd_fixer/app.log
```

---

## 📝 Логи

**Расположение:**
```
/var/log/nodir_hdd_fixer/
├── app.log           # Логи приложения
├── watchdog.log      # Логи watchdog
└── deploy.log        # Логи деплоя
```

**Просмотр:**
```bash
# Последние 50 строк
tail -50 /var/log/nodir_hdd_fixer/app.log

# В реальном времени
tail -f /var/log/nodir_hdd_fixer/app.log

# Поиск ошибок
grep "ERROR" /var/log/nodir_hdd_fixer/app.log
```

---

## ✅ Чек-лист активации

- [ ] Обновить код (`git pull`)
- [ ] Запустить деплоя (`./scripts/deploy-update.sh`)
- [ ] Запустить Watchdog (`./scripts/watchdog.sh`)
- [ ] Проверить Dashboard (`/admin/monitoring`)
- [ ] Протестировать Telegram (`./scripts/test-telegram-full.sh`)
- [ ] Проверить health checks
- [ ] Настроить автозапуск Watchdog (systemd)

---

**Готово! Умный сервер активирован! 🎉**
