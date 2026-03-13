#!/bin/bash

# Тест Telegram уведомлений RECOVERY.UZ
BOT_TOKEN="8759863943:AAHncy4_UyPHiidyTTLp5e2F9bFJCRTYqfI"
CHAT_ID="-1003765182373"

echo "🚀 Тест Telegram уведомлений RECOVERY.UZ"
echo ""

# Тестовое сообщение
MESSAGE="🎉 <b>ТЕСТ TELEGRAM УВЕДОМЛЕНИЙ</b>

✅ Бот подключён
✅ Chat ID: <code>${CHAT_ID}</code>
✅ RECOVERY.UZ готов к работе!

📦 Версия: 3c04022
⏱ Время: $(date '+%d.%m.%Y %H:%M')

🔧 Следующие тесты:
• Уведомление о деплое
• Уведомление о заказе
• Уведомление об ошибке"

echo "📤 Отправка тестового сообщения..."

RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"${MESSAGE}\",
    \"parse_mode\": \"HTML\"
  }")

if echo "$RESULT" | grep -q '"ok":true'; then
    echo ""
    echo "✅ СООБЩЕНИЕ ОТПРАВЛЕНО УСПЕШНО!"
    echo ""
    echo "Проверьте Telegram канал"
else
    echo ""
    echo "❌ ОШИБКА ОТПРАВКИ"
    echo ""
    echo "Ответ API:"
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
fi
