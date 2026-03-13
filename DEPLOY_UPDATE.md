# 🚀 Скрипты развёртывания RECOVERY.UZ

## Варианты развёртывания

### 1. Docker Compose (рекомендуется)

Для обновления на боевом сервере с Docker:

```bash
cd /path/to/nodir_hdd_fixer
./scripts/deploy-update.sh
```

**Что делает скрипт:**
- ✅ Обновляет код из Git
- ✅ Останавливает Docker контейнеры
- ✅ Очищает кэш Next.js и Turbo
- ✅ Устанавливает зависимости
- ✅ Собирает приложение
- ✅ Запускает контейнеры заново
- ✅ Показывает статус сервиса

---

### 2. PM2 (если используете PM2)

```bash
cd /path/to/nodir_hdd_fixer
./scripts/deploy-pm2.sh
```

**Что делает скрипт:**
- ✅ Обновляет код из Git
- ✅ Останавливает PM2 процессы
- ✅ Очищает кэш
- ✅ Устанавливает зависимости
- ✅ Собирает приложение
- ✅ Перезапускает процессы

---

### 3. Ручное обновление (Docker)

```bash
# Перейти в директорию проекта
cd /path/to/nodir_hdd_fixer

# Обновить код
git pull origin main

# Остановить сервис
docker compose -f docker-compose.prod.yml down

# Очистить кэш
rm -rf apps/web/.next
rm -rf .turbo

# Пересобрать и запустить
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

---

### 4. Ручное обновление (PM2)

```bash
cd /path/to/nodir_hdd_fixer

# Обновить код
git pull origin main

# Остановить
pm2 stop all

# Очистить кэш
rm -rf apps/web/.next .turbo

# Установить и собрать
npm ci --production
npm run build

# Перезапустить
pm2 restart all
pm2 status
```

---

## 🔧 Очистка кэша браузера

После развёртывания, если логотип не обновился:

1. **Hard Refresh:**
   - Windows/Linux: `Ctrl + Shift + R` или `Ctrl + F5`
   - macOS: `Cmd + Shift + R`

2. **Режим инкогнито:** Откройте сайт в режиме инкогнито

3. **Очистить кэш полностью:**
   - Chrome: `Settings → Privacy → Clear browsing data`
   - Firefox: `Options → Privacy → Clear Data`

---

## 📊 Мониторинг

### Docker логи
```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только web
docker compose -f docker-compose.prod.yml logs -f web

# Только API
docker compose -f docker-compose.prod.yml logs -f api
```

### PM2 логи
```bash
# Все логи
pm2 logs

# Только web
pm2 logs web

# Очистить логи
pm2 flush
```

---

## 🆘 Troubleshooting

### Логотип не обновился после развёртывания

1. Проверьте что код обновился:
```bash
git log -n 1
grep -r "RECOVERY.UZ" apps/web/src/components/logo.tsx
```

2. Очистите кэш Next.js вручную:
```bash
rm -rf apps/web/.next
docker compose -f docker-compose.prod.yml restart web
```

3. Проверьте версию в браузере (Ctrl+Shift+R)

### Ошибка сборки

```bash
# Очистить всё
rm -rf node_modules apps/web/node_modules apps/api/node_modules
rm -rf .next apps/web/.next
rm -rf .turbo

# Установить заново
npm ci
npm run build
```

### Контейнер не запускается

```bash
# Проверить логи
docker compose -f docker-compose.prod.yml logs web

# Пересобрать без кэша
docker compose -f docker-compose.prod.yml build --no-cache web
docker compose -f docker-compose.prod.yml up -d web
```

---

## 📝 Changelog развёртывания

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 13.03.2026 | Логотип RECOVERY.UZ, установка пароля админом |
