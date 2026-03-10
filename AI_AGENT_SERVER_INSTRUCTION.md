# 🤖 ИНСТРУКЦИЯ ДЛЯ ИИ-АГЕНТА НА СЕРВЕРЕ

## 📋 Проблема
На сервере запущен **только API** (NestJS, порт 3004), но **не запущен frontend** (Next.js, порт 3003).

## 🔍 Как проверить что работает

```bash
# Проверить API (должен отвечать)
curl http://localhost:3004/v1/health

# Проверить frontend (скорее всего НЕ отвечает)
curl http://localhost:3003
```

## 🚀 Решение

### Вариант 1: Запустить через npm (как на локалке)

```bash
# 1. Перейди в КОРЕНЬ проекта (НЕ в apps!)
cd /path/to/nodir_hdd_fixer

# 2. Установи зависимости (если ещё не установлены)
npm install

# 3. Запусти ВСЁ сразу (API + Frontend)
npm run dev
```

**Что запустится:**
- `apps/api` → http://localhost:3004 (NestJS API)
- `apps/web` → http://localhost:3003 (Next.js Frontend)

---

### Вариант 2: Запустить только frontend

```bash
cd /path/to/nodir_hdd_fixer
npm run dev:web
```

---

### Вариант 3: Docker (для продакшена)

```bash
cd /path/to/nodir_hdd_fixer

# 1. Создай .env.prod из примера
cp .env.production.example .env.prod

# 2. Отредактируй .env.prod (задай секреты, пароли)
nano .env.prod

# 3. Запусти через docker compose
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📁 Структура проекта

```
nodir_hdd_fixer/
├── apps/
│   ├── api/     # NestJS API (порт 3004)
│   └── web/     # Next.js Frontend (порт 3003) ← ЭТО НУЖНО ЗАПУСТИТЬ
├── packages/
│   └── shared/  # Общие типы
├── package.json # Корневой package.json с turbo
└── turbo.json   # Конфигурация Turbo
```

---

## ⚠️ Частые ошибки

### ❌ НЕПРАВИЛЬНО:
```bash
cd apps
npm run dev  # Так НЕ работает!
```

### ✅ ПРАВИЛЬНО:
```bash
cd /path/to/nodir_hdd_fixer  # КОРЕНЬ проекта!
npm run dev  # Turbo запустит оба сервиса
```

---

## 🔧 Если frontend не запускается

1. **Проверь что apps/web существует:**
   ```bash
   ls -la apps/web/package.json
   ```

2. **Проверь что есть зависимости:**
   ```bash
   ls -la apps/web/node_modules
   ```

3. **Установи зависимости:**
   ```bash
   cd /path/to/nodir_hdd_fixer
   npm install
   ```

4. **Проверь порты:**
   ```bash
   netstat -tlnp | grep -E "3003|3004"
   ```

---

## 📊 Как это работает

`npm run dev` в корне проекта использует **Turbo** который:
1. Сканирует `apps/*` на наличие `package.json` со скриптом `dev`
2. Запускает ВСЕ найденные приложения параллельно
3. API: `apps/api/package.json` → `next dev --webpack -p 3004`
4. Web: `apps/web/package.json` → `next dev --webpack -p 3003`

---

## 🎯 Быстрая проверка

После запуска открой в браузере:
- **Frontend:** http://localhost:3003
- **API Swagger:** http://localhost:3004/api/docs
- **API Health:** http://localhost:3004/v1/health

---

## 📞 Если что-то не так

1. Посмотри логи:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

2. Проверь процессы:
   ```bash
   ps aux | grep -E "node|next|nest"
   ```

3. Перезапусти:
   ```bash
   # Если через Docker
   docker compose -f docker-compose.prod.yml restart
   
   # Если через npm
   # Ctrl+C и снова npm run dev
   ```
