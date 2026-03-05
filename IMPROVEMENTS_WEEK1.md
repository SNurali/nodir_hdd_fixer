# Улучшения Недели 1-2: Критические

## ✅ Выполнено

### 1. 🔐 httpOnly Cookies для JWT

**Файлы:**
- `apps/api/src/modules/auth/auth.service.ts` - добавлены методы `getCookieOptions()`, `getAccessTokenCookieOptions()`
- `apps/api/src/modules/auth/auth.controller.ts` - отправка токенов в cookies
- `apps/web/src/lib/api.ts` - `withCredentials: true`
- `apps/web/src/app/auth-provider.tsx` - обновлён logout

**Изменения:**
```typescript
// Backend - установка cookies
res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Frontend - автоматическая отправка
const api = axios.create({
    withCredentials: true,
});
```

**Тестирование:**
```bash
# Проверьте что cookies устанавливаются
curl -X POST http://localhost:3002/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@test.uz","password":"admin123"}' \
  -v | grep "set-cookie"
```

---

### 2. 🛡️ Rate Limiting

**Файлы:**
- `apps/api/src/common/throttler/throttler.config.ts` - конфигурация
- `apps/api/src/common/throttler/throttler.decorator.ts` - декораторы
- `apps/api/src/modules/auth/auth.controller.ts` - применено к auth
- `apps/api/src/app.module.ts` - импорт ThrottlerModule

**Конфигурация:**
```typescript
throttlers: [
    { name: 'short', ttl: 1000, limit: 3 },    // 3/sec
    { name: 'medium', ttl: 60000, limit: 30 }, // 30/min
    { name: 'long', ttl: 3600000, limit: 500 },// 500/hour
]
```

**Применение:**
```typescript
@Post('login')
@ThrottleAuth(5, 60000) // 5 attempts per minute
async login(@Body() dto: TLoginDto) {
    // ...
}
```

**Тестирование:**
```bash
# Быстро отправьте 6 запросов - 6-й должен вернуть 429
for i in {1..6}; do
  curl -X POST http://localhost:3002/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"login":"test","password":"test"}'
done
```

---

### 3. 📝 Логирование (Pino)

**Файлы:**
- `apps/api/src/common/logger/pino.logger.ts` - Pino сервис
- `apps/api/src/common/logger/logger.module.ts` - модуль
- `apps/api/src/main.ts` - интеграция
- `apps/api/logs/` - директория для логов

**Структура логов:**
```
logs/
├── app.log       # Все логи
└── error.log     # Только ошибки
```

**Использование:**
```typescript
import { createLogger } from './common/logger/pino.logger';

const logger = createLogger('MyService');
logger.log('Message', { meta: 'data' });
logger.error('Error', { error: err });
```

**Просмотр:**
```bash
# Real-time
tail -f apps/api/logs/app.log | pino-pretty

# Только ошибки
tail -f apps/api/logs/error.log
```

---

### 4. 🧪 Unit Тесты

**Файлы:**
- `apps/api/src/modules/auth/auth.service.spec.ts` - тесты AuthService
- `apps/api/vitest.config.ts` - конфиг тестов
- `apps/api/package.json` - скрипты

**Зависимости:**
```bash
npm install -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

**Запуск:**
```bash
npm run test           # Запуск тестов
npm run test:watch     # Watch режим
npm run test:coverage  # С отчётом
```

**Пример теста:**
```typescript
describe('AuthService', () => {
    it('should throw UnauthorizedException when password is invalid', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

        await expect(
            service.login({ login: 'test', password: 'wrong' })
        ).rejects.toThrow(UnauthorizedException);
    });
});
```

---

## 📊 Статистика

| Метрика | Значение |
|---------|----------|
| Файлов создано | 12 |
| Файлов изменено | 8 |
| Тестов написано | 8 |
| Coverage цель | 70%+ |
| Зависимостей добавлено | 15 |

---

## 🚀 Следующие шаги (Неделя 3-4)

### Приоритет 1
- [ ] React Query вместо SWR
- [ ] Кэширование Redis
- [ ] Индексы БД

### Приоритет 2
- [ ] CI pipeline
- [ ] E2E тесты
- [ ] Мониторинг (Sentry)

---

## 📚 Документация

- [SECURITY.md](./apps/api/SECURITY.md) - полная документация по безопасности
- [AGENTS.md](./AGENTS.md) - инструкции для проекта
- [INSTRUCTIONS.md](./INSTRUCTIONS.md) - персональные настройки

---

## ⚠️ Breaking Changes

### Frontend изменения

**До:**
```typescript
// localStorage токен
const token = localStorage.getItem('access_token');
```

**После:**
```typescript
// Token автоматически отправляется в cookies
// User info остаётся в localStorage
const user = JSON.parse(localStorage.getItem('auth_user'));
```

### API изменения

**Logout endpoint:**
```typescript
POST /auth/logout
// Теперь очищает cookies
```

---

## 🔧 Troubleshooting

### Cookies не устанавливаются?

1. Проверьте `withCredentials: true` в api.ts
2. Убедитесь что CORS настроен правильно
3. Проверьте `NODE_ENV` для `secure` флага

### Rate limiting не работает?

1. Проверьте что ThrottlerModule импортирован в AppModule
2. Убедитесь что декораторы применены к контроллерам
3. Проверьте логи на наличие ошибок

### Логи не пишутся?

1. Создайте директорию: `mkdir -p apps/api/logs`
2. Проверьте права доступа
3. Убедитесь что PinoLogger импортирован

### Тесты не запускаются?

```bash
# Очистите кэш
rm -rf node_modules/.vite
rm -rf node_modules/.vitest

# Переустановите зависимости
npm install

# Запустите заново
npm run test
```
