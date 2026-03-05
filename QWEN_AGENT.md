# 🤖 Qwen CLI Agent

Интерактивный CLI-клиент для работы с моделями **Alibaba DashScope Qwen**.

## 🚀 Быстрый старт

### Запуск интерактивного режима (модель по умолчанию: qwen-plus)
```bash
npm run qwen
# или
node qwen-agent.js
```

### Одиночный запрос
```bash
npm run qwen "Ваш вопрос"
# или
node qwen-agent.js "Ваш вопрос"
```

### Выбрать конкретную модель
```bash
npm run qwen:plus "Вопрос"    # Qwen-Plus (баланс)
npm run qwen:max "Вопрос"     # Qwen-Max (максимальный интеллект)
npm run qwen:turbo "Вопрос"   # Qwen-Turbo (быстрый)
npm run qwen:coder "Вопрос"   # Qwen-Coder (для кода)
```

### Показать список моделей
```bash
npm run qwen:models
```

---

## 📋 Доступные модели

| Модель | Описание |
|--------|----------|
| `qwen-max` | Максимальная производительность, сложный интеллект |
| `qwen-plus` | **Баланс цены и качества** (по умолчанию) |
| `qwen-turbo` | Быстрая и недорогая |
| `qwen-long` | Для длинных контекстов (до 10M токенов) |
| `qwen-coder` | Специализация на генерации кода |
| `qwen-vl-max` | Мультимодальная (изображения + текст) |
| `qwen-vl-plus` | Мультимодальная баланс |
| `qwen-math-plus` | Математические задачи |
| `qwen-reranker` | Ранжирование результатов |

---

## 💬 Команды в интерактивном режиме

| Команда | Описание |
|---------|----------|
| `/models` | Показать список всех моделей |
| `/model <name>` | Сменить модель (например: `/model qwen-max`) |
| `/clear` | Очистить историю чата |
| `/exit` или `/quit` | Выйти |

---

## 🔧 Настройка

### 1. API ключ
Убедитесь, что в файле `.env` указан ваш API ключ:

```env
DASHSCOPE_API_KEY=sk-your-key-here
DASHSCOPE_ENDPOINT=https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### 2. Получение ключа
1. Перейдите на [Alibaba Cloud Model Studio](https://modelstudio.console.alibabacloud.com/)
2. Создайте API Key в разделе API-KEY
3. Скопируйте в `.env`

---

## 📊 Примеры использования

### Генерация кода
```bash
npm run qwen:coder "Напиши функцию на Python для сортировки слиянием"
```

### Анализ текста
```bash
npm run qwen:plus "Проанализируй этот текст: [ваш текст]"
```

### Математическая задача
```bash
npm run qwen "Реши: интеграл от x^2 dx от 0 до 3"
```

### Интерактивная сессия с qwen-max
```bash
node qwen-agent.js -m qwen-max
# Затем в чате:
# /model qwen-coder
# Напиши REST API на Express.js
```

---

## 🛠 Опции командной строки

```
node qwen-agent.js [опции] [запрос]

-m, --model <name>   Выбрать модель
-l, --list           Показать список моделей
-h, --help           Показать справку
```

---

## 📝 Заметки

- **Токены**: После каждого запроса показывается статистика использования токенов
- **История**: В интерактивном режиме сохраняется история чата (используйте `/clear` для очистки)
- **Контекст**: Модели поддерживают разную длину контекста (qwen-long — до 10M токенов)
