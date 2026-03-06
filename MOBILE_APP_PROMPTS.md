# PROMPT 1 - MVP FAST (3-5 дней)

Ты — senior mobile engineer. Нужно быстро сделать рабочий MVP мобильного приложения HDD Fixer в существующем монорепо.

Цель:
- Создать `apps/mobile` на Expo + TypeScript
- Подключить к существующему API `http://localhost:3004/v1`
- Реализовать ключевые user flows по ролям без поломки web

Стек:
- Expo + React Native + expo-router
- @tanstack/react-query
- zustand
- axios
- expo-secure-store
- socket.io-client (fallback polling)

Критичные flows MVP:
1) Auth:
- login/logout
- восстановление сессии
2) Orders:
- список заказов
- экран деталей заказа
3) Client:
- мои заказы
- approve/reject price
- просмотр оплат
4) Admin/Operator:
- назначение мастера по detail_id
- оплата (single + split)
- редактирование платежа
5) Master:
- мои заказы
- set/update price по позициям
- complete detail
6) Notifications:
- socket events + fallback polling

Бизнес-правила:
- Цена заказа = сумма detail.price
- Нельзя complete detail до одобрения цены
- Изменение цены после approve -> awaiting_approval
- issued только при полной оплате
- Назначение мастера только по detail endpoint

API:
- Использовать текущие endpoints backend.
- Ничего не ломать в web.
- Любые изменения backend только backward-compatible.

План реализации:
1. Создать `apps/mobile` и базовую архитектуру.
2. Сделать auth + role routing.
3. Реализовать orders list/detail.
4. Добавить role-specific actions.
5. Подключить платежи + edit payment.
6. Добавить notifications.
7. Проверить typecheck и базовые тесты.

Что выдать в финале:
1) Список измененных файлов
2) Рабочие команды запуска
3) Что покрыто из бизнес-правил
4) Что осталось в technical debt

# PROMPT 2 - FULL PRODUCTION (2-3 недели)

Ты — lead mobile architect. Реализуй production-ready мобильное приложение HDD Fixer на базе текущего монорепо.

Контекст:
- Монорепо: `apps/web`, `apps/api`, `packages/shared`
- API/Nest уже работает и содержит бизнес-логику заказов/оплат/ролей
- Нужно добавить `apps/mobile`, не ломая web

Цели:
1. Полноценный mobile client для ролей `admin/operator/master/client`
2. Стабильная архитектура, масштабируемый код, тесты
3. Высокая надежность сетевого слоя и UX в плохой сети
4. Подготовка к публикации iOS/Android

Требования по архитектуре:
- Expo + TS + expo-router
- FSD или модульная архитектура (feature-based)
- React Query + persist cache
- Zustand для session/UI state
- Secure token storage (expo-secure-store)
- i18n (ru/en/uz-lat/uz-cyr)
- централизованный error mapper API -> UI
- typed API layer + DTO из `packages/shared`
- socket service + fallback polling + reconnect strategy
- logging + monitoring hooks (Sentry optional)

Фичи:
A. Auth & Account
- login/logout/refresh
- forgot/reset password
- profile edit, telegram, avatar upload, password change
- role-based protected routes

B. Orders Core
- list/filter/search/sort
- order details with detail items
- lifecycle timeline
- chat/messages (если endpoints доступны)

C. Role workflows
- Client: approve/reject price, track status, notifications
- Admin/Operator: assign master per detail, status transitions, payments
- Master: assigned work, set/update price, complete detail

D. Payments
- single/split payment
- overpay prevention + warning
- edit payment with server-side validation
- payment history + totals consistency

E. Notifications
- in-app inbox
- realtime status updates
- app-state aware behavior (foreground/background)

F. UX/Quality
- offline-first read cache
- pull-to-refresh
- loading/empty/error states
- optimistic updates where safe
- accessibility + RTL-safe text layouts

Обязательные бизнес-ограничения:
- Мастер назначается только по каждой позиции отдельно
- total_price = сумма позиций
- status guards как в backend state machine
- complete detail только после price approval
- issued только при полной оплате (кроме zero-price)

Нефункциональные требования:
- строгая типизация
- no `any` в новых модулях
- тесты на критичные сценарии
- e2e smoke (минимум)
- CI-ready scripts

Этапы:
1. Scaffold `apps/mobile`, infra, env, navigation
2. Auth/session/guards
3. Orders read flows
4. Role actions
5. Payments + edit
6. Realtime + fallback
7. Localization
8. Testing hardening
9. Release prep (icons, splash, permissions, build profiles)

Критерии приёмки:
- Все роли работают end-to-end
- Нет регрессий в `apps/web` и `apps/api`
- Typecheck/test/build проходят
- Приложение запускается на Android/iOS (Expo)

Финальный отчёт:
1) Архитектурная схема
2) Изменения по файлам
3) API contracts
4) Что покрыто тестами
5) Риски и roadmap v2

# PROMPT 3 - ONLY CLIENT APP FIRST (самый безопасный старт)

Ты — senior RN dev. Реализуй мобильный клиент только для роли `client` как первый этап, без изменения backend контрактов.

Scope v1:
- login/register/logout
- profile screen
- my orders list
- order details
- approve/reject price
- payment history
- realtime status notifications (socket/poll fallback)
- localization

Out of scope v1:
- admin/operator/master actions
- payment edit
- complex backoffice flows

Tech:
- Expo + TS + expo-router + react-query + secure-store
- reuse DTO/types from `packages/shared`

Acceptance:
- client может полностью отследить и подтвердить заказ с телефона
- стабильная работа при потере сети
- корректные error states

Output:
- рабочий `apps/mobile`
- список экранов и маршрутов
- команды запуска
- список следующих шагов для v2 (staff roles)

# PROMPT 4 - STAFF APP FIRST (оператор + мастер)

Ты — senior RN engineer. Сделай мобильное приложение для внутренних сотрудников (operator/master/admin), client пока не трогай.

Scope:
- staff login
- order queue + filters
- order details
- assign master per detail
- set/update detail prices by status rules
- mark detail complete
- payments: add split + edit existing payment
- lifecycle updates

Key rule:
- ни одно действие staff не должно обходить backend guards

Tech:
- Expo + TS + strong typed API client
- роль-ориентированные экраны и permissions guard

Acceptance:
- оператор может полностью провести заказ от приема до оплаты
- мастер может работать только со своими назначенными деталями

# PROMPT 5 - TECH AUDIT + IMPLEMENTATION PLAN (перед кодом)

Ты — solution architect. Не пиши сразу много кода. Сначала сделай технический аудит текущего монорепо и выдай реалистичный implementation plan мобильного приложения.

Нужно:
1. Проанализировать:
- API endpoints готовности
- shared DTO readiness
- gaps для mobile
- auth/session risks
- realtime readiness
2. Составить phased plan:
- Phase 0 (setup)
- Phase 1 (auth + core)
- Phase 2 (role workflows)
- Phase 3 (payments + notifications)
- Phase 4 (hardening + release)
3. Для каждой фазы:
- задачи
- файлы
- риски
- критерии done
- оценка времени
4. После согласования — начать реализацию.

Ожидаемый output:
- таблица рисков
- dependency graph
- concrete backlog (checklist)
