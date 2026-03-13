# 📋 План развития RECOVERY.UZ

## Приоритеты на Март 2026

---

## 1️⃣ Telegram Уведомления ⭐⭐⭐

**Срок реализации:** 1-2 дня  
**Приоритет:** Критический

### 1.1 Уведомления о деплое

**Задачи:**
- [ ] Создать Telegram бота (@RecoveryUzBot)
- [ ] Получить токен бота и chat_id
- [ ] Добавить отправку уведомлений в `scripts/deploy-update.sh`
- [ ] Настроить сообщения: начало деплоя, успех, ошибка
- [ ] Добавить ссылку на коммит в уведомление

**Файлы для изменения:**
```
scripts/deploy-update.sh
scripts/deploy-pm2.sh
apps/api/src/modules/telegram/telegram.service.ts
```

**Пример сообщения:**
```
🚀 RECOVERY.UZ - Деплой завершён

✅ Успешно
Версия: 3f6e601
Коммит: добавить скрипты обновления
Время: 13.03.2026 14:30
```

---

### 1.2 Уведомления об ошибках

**Задачи:**
- [ ] Перехватывать критические ошибки API
- [ ] Отправлять стектрейс в Telegram
- [ ] Настроить фильтрацию (только критичные)
- [ ] Добавить кнопку "Починить" в уведомление

**Файлы для изменения:**
```
apps/api/src/common/filters/http-exception.filter.ts
apps/api/src/main.ts
apps/api/src/modules/telegram/telegram.service.ts
```

**Пример сообщения:**
```
❌ RECOVERY.UZ - Ошибка сервера

500 Internal Server Error
POST /orders/create
User: master_123

[Стектрейс...]
```

---

### 1.3 Уведомления о новых заказах

**Задачи:**
- [ ] Отправлять уведомление при создании заказа
- [ ] Уведомлять админа и оператора
- [ ] Уведомлять мастера при назначении
- [ ] Добавить информацию о заказе

**Файлы для изменения:**
```
apps/api/src/modules/orders/orders.service.ts
apps/api/src/modules/notifications/notifications.service.ts
```

**Пример сообщения:**
```
📦 Новый заказ #ABC123

Клиент: Иван И.
Устройство: HDD Seagate 1TB
Проблема: Не определяется
Сумма: 150,000 UZS

[Открыть в панели]
```

---

## 2️⃣ Мониторинг Сервера ⭐⭐⭐

**Срок реализации:** 2-3 дня  
**Приоритет:** Критический

### 2.1 CPU/RAM Использование

**Задачи:**
- [ ] Создать endpoint `/monitoring/resources`
- [ ] Сбор метрик: CPU%, RAM MB, Swap%
- [ ] Сохранять историю (Redis TimeSeries)
- [ ] Админ-панель с графиками

**API Endpoint:**
```typescript
GET /monitoring/resources
{
  "cpu": 45.2,
  "memory": {
    "used": 2048,
    "total": 4096,
    "percent": 50.1
  },
  "swap": {
    "used": 128,
    "total": 1024,
    "percent": 12.5
  }
}
```

**Файлы:**
```
apps/api/src/modules/monitoring/monitoring.controller.ts
apps/api/src/modules/monitoring/monitoring.service.ts
apps/web/src/app/admin/monitoring/page.tsx
```

---

### 2.2 Свободное место на диске

**Задачи:**
- [ ] Endpoint `/monitoring/disk`
- [ ] Мониторить: /, /uploads, /backups
- [ ] Тревога при <10% места
- [ ] Telegram уведомление при критичном уровне

**API Endpoint:**
```typescript
GET /monitoring/disk
{
  "root": {
    "used": 20,
    "total": 100,
    "percent": 20
  },
  "uploads": {
    "used": 5,
    "total": 50,
    "percent": 10
  }
}
```

---

### 2.3 Uptime Сервиса

**Задачи:**
- [ ] Endpoint `/monitoring/uptime`
- [ ] Считать uptime API, Web, PostgreSQL, Redis
- [ ] История доступности (99.9% target)
- [ ] Dashboard с графиками

**Файлы:**
```
apps/api/src/modules/monitoring/monitoring.service.ts
apps/web/src/app/admin/monitoring/page.tsx
```

**Пример сообщения:**
```
📊 RECOVERY.UZ - Мониторинг

Uptime: 99.95% (30 дней)
CPU: 45% ⚠️
RAM: 2.1GB / 4GB
Диск: 20GB / 100GB

[Открыть dashboard]
```

---

## 3️⃣ Автоматические Бэкапы БД ⭐⭐

**Срок реализации:** 2 дня  
**Приоритет:** Высокий

### 3.1 Ежедневные Бэкапы

**Задачи:**
- [ ] Скрипт `scripts/backup-db.sh`
- [ ] Cron на 03:00 ежедневно
- [ ] Сжатие gzip
- [ ] Хранение 7 последних бэкапов
- [ ] Логирование результатов

**Скрипт бэкапа:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U nodir_hdd_fixer -h localhost nodir_hdd_fixer | \
  gzip > backups/db_backup_$DATE.sql.gz
find backups -name "*.sql.gz" -mtime +7 -delete
```

**Файлы:**
```
scripts/backup-db.sh
crontab -e
```

---

### 3.2 Хранение в Облаке

**Задачи:**
- [ ] Настроить Google Drive / Yandex Disk
- [ ] Загрузка бэкапа после создания
- [ ] Шифрование перед отправкой
- [ ] Уведомление об успехе/ошибке

**Интеграция с Google Drive:**
```bash
# Установить rclone
apt install rclone

# Настроить remote
rclone config

# Загрузить бэкап
rclone copy backups/db_backup_$DATE.sql.gz gdrive:backups/
```

**Файлы:**
```
scripts/backup-cloud.sh
.env.production (добавить CLOUD_CREDENTIALS)
```

---

## 📅 Календарный План

### Неделя 1 (16-22 Марта)

**Понедельник-Вторник:**
- [ ] 1.1 Telegram бот
- [ ] 1.1 Уведомления о деплое

**Среда-Четверг:**
- [ ] 1.2 Уведомления об ошибках
- [ ] 1.3 Уведомления о заказах

**Пятница:**
- [ ] Тестирование Telegram
- [ ] Документация

---

### Неделя 2 (23-29 Марта)

**Понедельник-Вторник:**
- [ ] 2.1 CPU/RAM мониторинг
- [ ] 2.2 Диск мониторинг

**Среда-Четверг:**
- [ ] 2.3 Uptime
- [ ] Админ dashboard

**Пятница:**
- [ ] Тестирование мониторинга
- [ ] Настройка алертов

---

### Неделя 3 (30 Марта - 5 Апреля)

**Понедельник:**
- [ ] 3.1 Скрипт бэкапа
- [ ] Настройка cron

**Вторник-Среда:**
- [ ] 3.2 Облачное хранилище
- [ ] Шифрование

**Четверг-Пятница:**
- [ ] Тестирование восстановления
- [ ] Документация

---

## 🎯 Критерии Успеха

### Telegram Уведомления ✅
- [ ] Бот отправляет сообщения
- [ ] Деплой уведомляет в Telegram
- [ ] Ошибки логируются и отправляются
- [ ] Новые заказы видны в канале

### Мониторинг ✅
- [ ] Dashboard доступен `/admin/monitoring`
- [ ] Графики CPU/RAM/Disk работают
- [ ] Uptime считается корректно
- [ ] Алерты приходят при >90%

### Бэкапы ✅
- [ ] Бэкап создаётся ежедневно в 03:00
- [ ] 7 последних бэкапов хранятся
- [ ] Копия в облаке актуальна
- [ ] Восстановление работает

---

## 📊 Метрики

| Метрика | Target | Текущий |
|---------|--------|---------|
| Uptime | 99.9% | - |
| Время деплоя | <5 мин | - |
| Время восстановления | <15 мин | - |
| RPO (Backup) | 24 часа | - |
| RTO (Recovery) | 1 час | - |

---

## 🔧 Технические Детали

### Стек технологий

**Telegram:**
- `node-telegram-bot-api` или `telegraf`
- Inline кнопки
- Webhooks

**Мониторинг:**
- `systeminformation` (Node.js пакет)
- Redis TimeSeries для истории
- Chart.js для графиков

**Бэкапы:**
- `pg_dump` (PostgreSQL)
- `gzip` (сжатие)
- `rclone` (облако)

---

## 📝 Зависимости

```json
{
  "dependencies": {
    "telegraf": "^4.15.0",
    "systeminformation": "^5.22.0",
    "node-cron": "^3.0.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0"
  }
}
```

---

## 🚀 Начало Работы

**Команда для старта:**

```bash
cd /home/mrnurali/nodir_hdd_fixer

# Создать ветку
git checkout -b feature/telegram-notifications

# Установить зависимости
npm install telegraf --workspace=apps/api

# Начать реализацию
```

---

**Готов приступить к реализации?** 🤖

Выберите с чего начать:
1. Telegram бот (самое важное)
2. Мониторинг dashboard
3. Бэкапы
