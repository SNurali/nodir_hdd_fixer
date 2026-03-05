# Безопасность HDD Fixer API

## 🔒 Реализованные меры безопасности

### 1. httpOnly Cookies для JWT

Токены теперь хранятся в httpOnly cookies вместо localStorage:

- **access_token**: 15 минут, httpOnly
- **refresh_token**: 7 дней, httpOnly

**Преимущества:**
- Защита от XSS атак
- JavaScript не имеет доступа к токенам
- Автоматическая отправка cookies

**Настройка:**
```typescript
// AuthService.getCookieOptions()
{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

### 2. Rate Limiting

Защита от brute-force и DDoS атак:

| Endpoint | Лимит | Окно |
|----------|-------|------|
| `/auth/login` | 5 запросов | 1 минута |
| `/auth/register` | 3 запроса | 1 минута |
| `/auth/refresh` | 10 запросов | 1 минута |
| Все API | 3 запроса | 1 секунда |
| Все API | 30 запросов | 1 минута |
| Все API | 500 запросов | 1 час |

**Исключения:**
- `/health` - health checks
- `/api/docs` - Swagger UI

### 3. Логирование (Pino)

Асинхронное логирование с ротацией:

**Файлы:**
- `logs/app.log` - все логи
- `logs/error.log` - только ошибки
- Console stdout - для development

**Redact данные:**
```typescript
redact: {
    paths: ['password', 'secret', 'token', 'authorization', 'cookie'],
    censor: '**REDACTED**',
}
```

### 4. Helmet.js

HTTP заголовки безопасности:

```typescript
helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: [`'self'`],
            styleSrc: [`'self'`, `'unsafe-inline'`],
            imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
            scriptSrc: [`'self'`, `https:'unsafe-inline'`],
        },
    },
})
```

### 5. CORS

Строгая CORS политика:

```typescript
{
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    exposedHeaders: 'Set-Cookie',
}
```

## 🧪 Тестирование

Запуск тестов:

```bash
npm run test           # Один запуск
npm run test:watch     # Watch режим
npm run test:coverage  # С отчётом coverage
```

Пример теста:

```typescript
describe('AuthService', () => {
    it('should throw UnauthorizedException when password is invalid', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

        await expect(
            service.login({ login: 'test@example.com', password: 'wrong-password' })
        ).rejects.toThrow(UnauthorizedException);
    });
});
```

## 📊 Логи

Просмотр логов:

```bash
# Real-time
tail -f logs/app.log

# Только ошибки
tail -f logs/error.log

# С форматированием
cat logs/app.log | pino-pretty
```

## 🔐 Рекомендации для Production

1. **HTTPS обязательно**
   ```typescript
   secure: true // В cookie options
   ```

2. **Обновите JWT секреты**
   ```bash
   JWT_SECRET=<strong-random-string>
   JWT_REFRESH_SECRET=<another-strong-random-string>
   ```

3. **Настройте Redis для rate limiting**
   ```bash
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   ```

4. **Мониторинг логов**
   - Интегрируйте с ELK Stack или Datadog
   - Настройте алерты на ошибки

5. **Регулярная ротация ключей**
   - Меняйте JWT секреты каждые 30 дней
   - Имейте план миграции токенов

## 🚨 Response при нарушениях

### 429 Too Many Requests

```json
{
    "statusCode": 429,
    "message": "Too many requests",
    "error": "Too Many Requests"
}
```

### 401 Unauthorized

```json
{
    "statusCode": 401,
    "message": "Invalid credentials",
    "error": "Unauthorized"
}
```

## 📚 Дополнительные ресурсы

- [NestJS Throttler](https://docs.nestjs.com/techniques/security#rate-limiting)
- [Pino Documentation](https://getpino.io/)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
