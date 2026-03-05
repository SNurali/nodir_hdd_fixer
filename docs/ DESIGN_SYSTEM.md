# 🎨 Дизайн-система: HDD Fixer Service Center

## Версия: 1.0
## Дата: 2026

---

# 1️⃣ ЦВЕТОВАЯ ПАЛИТРА

## Светлая тема (Primary)

| Назначение | Название | HEX | Применение |
|-----------|---------|-----|------------|
| **Primary** | Trust Blue | `#2563EB` | Основные кнопки, ссылки, акценты |
| **Primary Hover** | Deep Blue | `#1D4ED8` | Состояние hover |
| **Primary Light** | Sky Blue | `#DBEAFE` | Фоны, подсветки |
| **Secondary** | Slate | `#475569` | Вторичные элементы |
| **Accent** | Emerald | `#10B981` | Успех, подтверждение |

## Нейтральные

| Назначение | Название | HEX | Применение |
|-----------|---------|-----|------------|
| **Background** | White | `#FFFFFF` | Основной фон |
| **Background Secondary** | Cool Gray | `#F8FAFC` | Карточки, секции |
| **Surface** | Pure White | `#FFFFFF` | Поверхности |
| **Border** | Light Gray | `#E2E8F0` | Границы, разделители |
| **Border Hover** | Medium Gray | `#CBD5E1` | Состояние hover |

## Текст

| Назначение | Название | HEX | Применение |
|-----------|---------|-----|------------|
| **Text Primary** | Slate 900 | `#0F172A` | Заголовки, основной текст |
| **Text Secondary** | Slate 500 | `#64748B` | Подписи, описания |
| **Text Muted** | Slate 400 | `#94A3B8` | Плейсхолдеры |

## Статусы

| Назначение | Название | HEX | Применение |
|-----------|---------|-----|------------|
| **Success** | Emerald 500 | `#10B981` | Успех, выполнено |
| **Success Light** | Emerald 100 | `#D1FAE5` | Фон успеха |
| **Warning** | Amber 500 | `#F59E0B` | Предупреждение |
| **Warning Light** | Amber 100 | `#FEF3C7` | Фон предупреждения |
| **Error** | Red 500 | `#EF4444` | Ошибка |
| **Error Light** | Red 100 | `#FEE2E2` | Фон ошибки |
| **Info** | Blue 500 | `#3B82F6` | Информация |

## Тёмная тема (опционально)

| Назначение | HEX |
|-----------|-----|
| Background | `#0F172A` |
| Surface | `#1E293B` |
| Text Primary | `#F8FAFC` |
| Text Secondary | `#94A3B8` |
| Border | `#334155` |

---

# 2️⃣ DESIGN TOKENS

## Spacing (отступы)

| Token | Значение | Применение |
|-------|---------|------------|
| `xs` | 4px | Минимальные отступы |
| `sm` | 8px | Компоненты |
| `md` | 16px | Карточки |
| `lg` | 24px | Секции |
| `xl` | 32px | Блоки |
| `2xl` | 48px | Отступы между секциями |

## Border Radius

| Token | Значение | Применение |
|-------|---------|------------|
| `sm` | 8px | Кнопки, инпуты |
| `md` | 12px | Карточки |
| `lg` | 16px | Модальные окна |
| `xl` | 24px | Основные карточки |
| `full` | 9999px | Аватарки, круглые кнопки |

## Typography

| Token | Размер | Вес | Line-height |
|-------|--------|-----|-------------|
| `xs` | 12px | 400 | 16px |
| `sm` | 14px | 400 | 20px |
| `base` | 16px | 400 | 24px |
| `lg` | 18px | 500 | 28px |
| `xl` | 20px | 600 | 28px |
| `2xl` | 24px | 700 | 32px |
| `3xl` | 30px | 800 | 36px |
| `4xl` | 36px | 800 | 40px |

**Font Family:** Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

## Shadows

| Token | Значение | Применение |
|-------|---------|------------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Мелкие элементы |
| `md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Карточки |
| `lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Кнопки |
| `xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Модальные |

## Animation

| Token | Значение |
|-------|----------|
| `fast` | 150ms |
| `normal` | 200ms |
| `slow` | 300ms |
| `slower` | 500ms |

---

# 3️⃣ UI COMPONENTS

## Buttons (Кнопки)

### Primary Button
- **Назначение:** Главное действие на экране
- **Background:** `#2563EB`
- **Text:** White, 16px, semibold
- **Padding:** 16px 24px
- **Border-radius:** 12px
- **Hover:** Background `#1D4ED8`, translateY(-2px), shadow-lg
- **Active:** translateY(0)
- **Disabled:** opacity 50%, cursor not-allowed

### Secondary Button
- **Назначение:** Второстепенное действие
- **Background:** White
- **Border:** 2px solid `#E2E8F0`
- **Text:** `#0F172A`, 16px, semibold
- **Hover:** Border `#CBD5E1`, background `#F8FAFC`

### Danger Button
- **Назначение:** Удаление, отмена
- **Background:** `#EF4444`
- **Text:** White
- **Hover:** Background `#DC2626`

### Ghost Button
- **Назначение:** Третичное действие
- **Background:** transparent
- **Text:** `#64748B`
- **Hover:** background `#F1F5F9`

---

## Input Fields (Поля ввода)

### Text Input
- **Height:** 52px (48px mobile)
- **Background:** White
- **Border:** 2px solid `#E2E8F0`
- **Border-radius:** 12px
- **Padding:** 16px 20px
- **Text:** `#0F172A`, 16px
- **Placeholder:** `#94A3B8`, 16px
- **Focus:** Border `#2563EB`, ring 4px `#2563EB/10%`

### Select / Dropdown
- **Структура:** Как Text Input
- **Icon:** Chevron down, 20px, `#64748B`
- **Options:** White background, 12px border-radius, shadow-md
- **Option hover:** Background `#F8FAFC`

### Language Switcher
- **Тип:** Segmented control (pill shape)
- **Background:** `#F1F5F9`
- **Active:** White, shadow-sm
- **Text active:** `#2563EB`
- **Text inactive:** `#64748B`
- **Border-radius:** 8px

---

## Cards (Карточки)

### Base Card
- **Background:** White
- **Border:** 1px solid `#E2E8F0`
- **Border-radius:** 16px (24px mobile)
- **Padding:** 24px
- **Shadow:** `0 4px 6px -1px rgba(0,0,0,0.1)`
- **Hover:** Shadow-lg

### Stat Card
- **Background:** White
- **Border-radius:** 16px
- **Padding:** 20px
- **Icon container:** 48px, border-radius 12px, background `#2563EB/10%`

---

## Status Badges (Бейджи статусов)

| Статус | Background | Text | Border |
|--------|------------|------|--------|
| Новый | `#DBEAFE` | `#2563EB` | `#2563EB/20%` |
| В работе | `#FEF3C7` | `#D97706` | `#F59E0B/20%` |
| Ожидание | `#FEF3C7` | `#D97706` | `#F59E0B/20%` |
| Завершён | `#D1FAE5` | `#059669` | `#10B981/20%` |
| Выдан | `#D1FAE5` | `#059669` | `#10B981/20%` |
| Проблема | `#FEE2E2` | `#DC2626` | `#EF4444/20%` |

**Border-radius:** 9999px (pill)
**Padding:** 4px 12px
**Font:** 12px, semibold

---

## Modals (Модальные окна)

- **Overlay:** Black 50%
- **Background:** White
- **Border-radius:** 24px
- **Padding:** 32px
- **Shadow:** 0 25px 50px -12px rgba(0,0,0,0.25)
- **Close button:** Top right, 40px, ghost style
- **Backdrop click:** Closes modal

---

## Navigation (Навигация)

### Mobile Bottom Nav
- **Height:** 80px (safe-area + 64px)
- **Background:** White
- **Border-top:** 1px `#E2E8F0`
- **Icons:** 24px
- **Labels:** 12px
- **Active:** Color `#2563EB`
- **Inactive:** Color `#94A3B8`

### Mobile Header
- **Height:** 56px
- **Background:** White
- **Border-bottom:** 1px `#E2E8F0`
- **Title:** 18px, semibold

### Web Sidebar (опционально)
- **Width:** 280px
- **Background:** White
- **Border-right:** 1px `#E2E8F0`
- **Item height:** 48px
- **Active:** Background `#2563EB/10%`, text `#2563EB`

---

## Alerts / Toasts

### Success Toast
- **Background:** `#D1FAE5`
- **Border:** 1px `#10B981/20%`
- **Icon:** Check circle, `#10B981`
- **Border-radius:** 12px

### Error Toast
- **Background:** `#FEE2E2`
- **Border:** 1px `#EF4444/20%`
- **Icon:** Alert circle, `#EF4444`

### Info Toast
- **Background:** `#DBEAFE`
- **Border:** 1px `#3B82F6/20%`

**Position:** Top center (mobile), Bottom right (web)
**Animation:** Slide in, 200ms

---

# 4️⃣ UX-ФЛОУ

## A) Клиент (без регистрации)

### Экран 1: Главная / Landing
**URL:** `/` (редирект на `/orders/new` если не авторизован)

**Цель:** Понять, куда попал, создать заявку

**Элементы:**
1. Логотип + название (слева)
2. Язык (справа, компактный переключатель)
3. Заголовок: "Сервисный центр ремонта"
4. Подзаголовок: "Быстро. Прозрачно. Профессионально."
5. Карточка-призыв: "Нужна консультация?" → Кнопка "Оставить заявку"
6. Контакты сервиса (телефон, адрес)

**Основное действие:** Кнопка "Оставить заявку"

---

### Экран 2: Создание заявки (4 шага)

**Цель:** Оформить заявку максимально просто

**Шаг 1: Оборудование**
- Заголовок: "Что нужно отремонтировать?"
- Подзаголовок: "Выберите тип устройства"
- Сетка иконок (2-3 ряда): Ноутбук, Телефон, Планшет, Часы, Принтер, Другое
- Каждая иконка: 80px, label внизу

**Шаг 2: Проблема**
- Заголовок: "Что случилось?"
- Список проблем (радио-кнопки): Не включается, Разбит экран, Не заряжается, Зависает, Другое
- Текстовое поле "Опишите подробнее" (опционально)

**Шаг 3: Контакты**
- Заголовок: "Как с вами связаться?"
- Поле: Имя
- Поле: Телефон
- Выбор языка (Select)

**Шаг 4: Подтверждение**
- Заголовок: "Проверьте данные"
- Карточка с введёнными данными
- Кнопка: "Отправить заявку"

**Навигация:**
- Прогресс-бар сверху
- Кнопка "Назад" / "Далее" снизу

---

### Экран 3: Подтверждение
**Цель:** Успешное завершение

**Элементы:**
- Иконка: Зелёная галочка (крупно)
- Заголовок: "Заявка принята!"
- Подзаголовок: "Мы свяжемся с вами в течение 15 минут"
- Номер заявки: #12345
- Кнопка: "На главную"

---

## B) Клиент (зарегистрированный)

### Экран: Вход / Login
**URL:** `/login`

**Цель:** Войти в систему

**Элементы:**
1. Логотип + название
2. Переключатель языка (RU/UZ/EN)
3. Поле: Телефон или Email
4. Поле: Пароль
5. Кнопка: "Войти"
6. Ссылка: "Зарегистрироваться"
7. Кнопка: "Войти без регистрации" → на /orders/new

---

### Экран: Личный кабинет / Dashboard
**URL:** `/` (для авторизованных)

**Цель:** Видеть свои заказы

**Элементы:**
1. Header: Лого, Профиль (имя), Выход
2. Приветствие: "Добро пожаловать, [Имя]!"
3. Секция "Мои заказы":
   - Карточки заказов
   - Каждая карточка: ID, дата, статус, сумма
4. Кнопка: "Новая заявка"

---

### Экран: Детали заказа
**URL:** `/orders/[id]`

**Цель:** Отследить статус

**Элементы:**
1. Header: Назад, "Заказ #12345"
2. Статус (крупный бейдж)
3. Timeline / История:
   - Заявка создана
   - Принят в работу
   - В ремонте
   - Готов к выдаче
4. Детали: Устройство, Проблема, Цена
5. Кнопка: "Связаться с нами" (Telegram/телефон)

---

## B) Оператор

### Экран: Список заказов
**URL:** `/orders`

**Цель:** Управлять заказами

**Элементы:**
1. Header: Лого, Профиль
2. Фильтры: Все, Новые, В работе, Завершённые
3. Таблица/список:
   - ID, Клиент, Статус, Дата, Сумма
4. Действия: Принять, Отклонить, Подробнее

---

### Экран: Создание заказа
**URL:** `/orders/new`

**Цель:** Оформить заказ за клиента

**Элементы:**
- Выбор клиента (поиск или создать)
- Добавление устройств и услуг
- Выбор мастера (опционально)
- Предоплата (опционально)

---

## C) Администратор

### Экран: Дашборд
**URL:** `/`

**Цель:** Обзор системы

**Элементы:**
- Статистика: Всего заказов, В работе, Завершено сегодня, Выручка
- Графики (опционально)
- Список "Требуют внимания"
- Кнопки быстрых действий

---

### Экран: Управление заказом
**URL:** `/orders/[id]`

**Дополнительно для админа:**
- Назначить мастера
- Изменить цену
- Принять/отклонить
- Закрыть заказ
- Вернуть деньги

---

## D) Мастер

### Экран: Мои задачи
**URL:** `/orders/assigned`

**Цель:** Видеть назначенные заказы

**Элементы:**
- Список заказов со статусом "В работе"
- Детали: Клиент, Устройство, Проблема
- Кнопка: "Взять в работу"
- Кнопка: "Отметить готовым"

---

# 5️⃣ UX-ТЕКСТЫ (4 ЯЗЫКА)

## Общие

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| save | Сохранить | Сақлаш | Saqlash | Save |
| cancel | Отмена | Бекор қилиш | Bekor qilish | Cancel |
| back | Назад | Ортга | Orqaga | Back |
| next | Далее | Кейинги | Keyingi | Next |
| confirm | Подтвердить | Тасдиқлаш | Tasdiqlash | Confirm |
| close | Закрыть | Ёпиш | Yopish | Close |
| search | Поиск... | Қидирув... | Qidiruv... | Search... |
| loading | Загрузка... | Юкланмоқда... | Yuklanmoqda... | Loading... |
| error | Ошибка | Хатолик | Xatolik | Error |
| success | Успешно | Муваффақиятли | Muvaffaqiyatli | Success |

---

## Вход / Регистрация

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| login.title | Вход в систему | Тизимга кириш | Tizimga kirish | Sign In |
| login.phone | Телефон | Телефон | Telefon | Phone |
| login.phone_placeholder | +998 90 123-45-67 | +998 90 123-45-67 | +998 90 123-45-67 | +998 90 123-45-67 |
| login.password | Пароль | Парол | Parol | Password |
| login.submit | Войти | Кириш | Kirish | Sign In |
| login.no_account | Нет аккаунта? | Аккаунтингиз йоқми? | Akkauntingiz yo'qmi? | Don't have an account? |
| login.register | Зарегистрироваться | Рўйхатдан ётиш | Ro'yxatdan o'tish | Register |
| login.order_guest | Оформить заказ без регистрации | Рўйхатсиз буюртма | Ro'yxatsiz buyurtma | Order without registration |

| register.title | Регистрация | Рўйхатдан ётиш | Ro'yxatdan o'tish | Register |
| register.name | Ваше имя | Исмингиз | Ismingiz | Your name |
| register.name_placeholder | Иван Иванов | Аҳмад Аҳмадов | Ahmad Ahmadov | John Doe |
| register.submit | Зарегистрироваться | Рўйхатдан ётиш | Ro'yxatdan o'tish | Register |
| register.success | Аккаунт создан! | Аккаунт яратилди! | Account yaratildi! | Account created! |

---

## Заказ (без регистрации)

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| order.title | Оставить заявку | Ариза қолдириш | Ariza qoldirish | Submit Request |
| order.subtitle | Это займёт 1 минуту | Бу 1 дақиқа олади | Bu 1 daqiqa oladi | Takes 1 minute |
| order.step1_title | Что нужно отремонтировать? | Нимани таъмирлаш керак? | Nimani ta'mirlash kerak? | What needs repair? |
| order.step1_subtitle | Выберите тип устройства | Ускуна турини танланг | Uskuna turini tanlang | Select device type |
| order.step2_title | Что случилось? | Нима бўлган? | Nima bo'lgan? | What happened? |
| order.step2_subtitle | Опишите проблему | Муаммони батафсил ёзинг | Muammoni batafsil yozing | Describe the problem |
| order.step3_title | Как с вами связаться? | Сиз билан қандай богланиш? | Siz bilan qanday bog'lanish? | How to contact you? |
| order.step3_subtitle | Оставьте контактные данные | Контакт маълумотларингизни қолдиринг | Ma'lumotlaringizni qoldiring | Leave your contact details |
| order.step4_title | Подтвердите заявку | Аризани тасдиқланг | Ariza tasdiqlang | Confirm request |
| order.submit | Отправить заявку | Юбориш | Yuborish | Submit |
| order.success_title | Заявка принята! | Ариза қабул қилинди! | Ariza qabul qilindi! | Request Submitted! |
| order.success_message | Мы свяжемся с вами в течение 15 минут | Биз 15 дақиқа ичида сиз билан богланамиз | 15 daqiqa ichida siz bilan bog'lanamiz | We'll contact you within 15 minutes |
| order.id | Номер заявки | Ариза рақами | Ariza raqami | Request ID |

---

## Статусы заказа

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| status.new | Новая | Янги | Yangi | New |
| status.accepted | Принят | Қабул қилинди | Qabul qilindi | Accepted |
| status.in_progress | В работе | Жараёнда | Jarayonda | In Progress |
| status.waiting_for_parts | Ожидание запчастей | Эҳтиёт қисмлар кутилмоқда | Ehtiyot qismlar kutilmoqda | Waiting for Parts |
| status.completed | Завершён | Тугатилди | Tugatildi | Completed |
| status.unrepairable | Не подлежит ремонту | Таъмирлаб бўлмайди | Ta'mirlab bo'lmaydi | Cannot be Repaired |
| status.issued | Выдан | Топширилди | Topshirildi | Issued |

---

## Дашборд

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| dashboard.welcome | Добро пожаловать | Хуш келибсиз | Xush kelibsiz | Welcome |
| dashboard.my_orders | Мои заказы | Менинг буюртмаларим | Mening buyurtmalarim | My Orders |
| dashboard.new_order | Новая заявка | Янги ариза | Yangi ariza | New Request |
| dashboard.total_orders | Всего заказов | Жами буюртмалар | Jami buyurtmalar | Total Orders |
| dashboard.active | В работе | Жараёнда | Jarayonda | Active |
| dashboard.completed | Завершено | Тугатилди | Tugatildi | Completed |
| dashboard.revenue | Выручка | Тушум | Tushum | Revenue |

---

## Оплата

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| payment.title | Оплата | Тўлов | To'lov | Payment |
| payment.amount | Сумма | Сумма | Summa | Amount |
| payment.type | Способ оплаты | Тўлов усули | To'lov usuli | Payment Method |
| payment.cash | Наличные | Нақд | Naqd | Cash |
| payment.card | Карта | Карта | Karta | Card |
| payment.submit | Оплатить | Тўлаш | To'lash | Pay |
| payment.success | Оплата успешна | Тўлов муваффақиятли | To'lov muvaffaqiyatli | Payment Successful |

---

## Уведомления

| Ключ | Русский | Узбекский (кир) | Узбекский (лат) | Английский |
|------|---------|-----------------|------------------|------------|
| notify.order_created | Заявка создана | Ариза яратилди | Ariza yaratildi | Request Created |
| notify.order_accepted | Заявка принята | Ариза қабул қилинди | Ariza qabul qilindi | Request Accepted |
| notify.order_in_progress | Работа начата | Иш бошланди | Ish boshlandi | Work Started |
| notify.order_ready | Заказ готов | Буюртма тайёр | Buyurtma tayyor | Order Ready |
| notify.order_completed | Заказ завершён | Буюртма тугатилди | Buyurtma tugatildi | Order Completed |
| notify.payment_received | Платёж получен | Тўлов олинди | To'lov olindi | Payment Received |

---

# 6️⃣ Figma SPECIFICATIONS

## Название Design System
**HDD Fixer Design System v1.0**

## Color Styles (Figma)
```
/colors/primary/blue-500 → #2563EB
/colors/primary/blue-600 → #1D4ED8
/colors/primary/blue-100 → #DBEAFE
/colors/success/green-500 → #10B981
/colors/success/green-100 → #D1FAE5
/colors/warning/amber-500 → #F59E0B
/colors/warning/amber-100 → #FEF3C7
/colors/error/red-500 → #EF4444
/colors/error/red-100 → #FEE2E2
/colors/neutral/slate-900 → #0F172A
/colors/neutral/slate-500 → #64748B
/colors/neutral/slate-400 → #94A3B8
/colors/neutral/slate-100 → #F1F5F9
/colors/neutral/slate-50 → #F8FAFC
/colors/white → #FFFFFF
```

## Text Styles (Figma)
```
/typography/heading/4xl → Inter Bold 36px
/typography/heading/3xl → Inter Bold 30px
/typography/heading/2xl → Inter Bold 24px
/typography/heading/xl → Inter Semibold 20px
/typography/body/lg → Inter Regular 18px
/typography/body/base → Inter Regular 16px
/typography/body/sm → Inter Regular 14px
/typography/body/xs → Inter Regular 12px
```

## Component Libraries
- Auto Layout everywhere
- Variants для состояний
- Token-driven colors
- Props: variant, size, state

## Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

# 7️⃣ CHECKLIST ДЛЯ FRONTEND

- [ ] Настроить CSS Variables (tokens)
- [ ] Создать Button component (4 variants)
- [ ] Создать Input component
- [ ] Создать Select component
- [ ] Создать Card component
- [ ] Создать Badge component (статусы)
- [ ] Создать Modal component
- [ ] Создать Toast component
- [ ] Настроить шрифт Inter
- [ ] Mobile Bottom Navigation
- [ ] Language Switcher
- [ ] Адаптивные стили

---

**Документ готов к передаче в разработку и Figma**
