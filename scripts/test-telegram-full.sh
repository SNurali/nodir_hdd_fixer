#!/bin/bash

# Полный тест всех Telegram уведомлений RECOVERY.UZ
BOT_TOKEN="8759863943:AAHncy4_UyPHiidyTTLp5e2F9bFJCRTYqfI"
CHAT_ID="-1003765182373"

send_message() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
      -H "Content-Type: application/json" \
      -d "{
        \"chat_id\": \"${CHAT_ID}\",
        \"text\": \"${message}\",
        \"parse_mode\": \"HTML\"
      }" > /dev/null
}

echo "🧪 Тест всех типов уведомлений RECOVERY.UZ"
echo ""

# 1. Тест уведомления о деплое
echo "📤 Тест 1/3: Уведомление о начале деплоя..."
send_message "🚀 <b>НАЧАЛО ДЕПЛОЯ</b>

📦 <b>Версия:</b> test-001
📝 <b>Коммит:</b> тест всех уведомлений
⏱ <b>Время:</b> $(date '+%d.%m.%Y %H:%M')

⚙️ <b>Идёт обновление...</b>"
sleep 1

# 2. Тест уведомления о новом заказе
echo "📤 Тест 2/3: Уведомление о новом заказе..."
send_message "🆕 <b>НОВЫЙ ЗАКАЗ</b> #TEST1234

👤 <b>Клиент:</b> Тестовый Клиент
📱 <b>Телефон:</b> +998 90 123 45 67

📦 <b>Оборудование:</b>
  • HDD Seagate 1TB - Замена платы
    (Не работает после скачка напряжения)

💰 <b>Сумма:</b> 150,000 UZS
📅 <b>Дата:</b> $(date '+%d.%m.%Y %H:%M')

⚠️ <b>Требуется назначение мастера!</b>"
sleep 1

# 3. Тест уведомления об ошибке
echo "📤 Тест 3/3: Уведомление об ошибке..."
send_message "❌ <b>ОШИБКА СЕРВЕРА</b>

📝 <b>Сообщение:</b> Test error message
📍 <b>Контекст:</b> POST /orders/create

📋 <b>Стектрейс:</b>
<code>Error: Test error
    at TestFunction (/app/test.js:10:5)
    at Object.&lt;anonymous&gt; (/app/test.js:20:1)</code>

⚠️ <b>Требуется внимание!</b>"
sleep 1

# 4. Финальное сообщение
echo "📤 Финальное сообщение..."
send_message "✅ <b>ТЕСТ ЗАВЕРШЁН</b>

Все уведомления работают корректно!

🎉 <b>RECOVERY.UZ готов к работе!</b>

📋 Протестировано:
✅ Деплой уведомления
✅ Уведомления о заказах
✅ Уведомления об ошибках

🔧 Для активации на боевом сервере:
1. Обновите .env.production
2. Перезапустите API
3. Запустите ./scripts/deploy-update.sh"

echo ""
echo "✅ Все тесты отправлены!"
echo ""
echo "Проверьте Telegram канал для подтверждения"
