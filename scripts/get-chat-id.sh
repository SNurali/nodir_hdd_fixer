#!/bin/bash

# ===========================================
# Скрипт для получения Chat ID из канала
# ===========================================

BOT_TOKEN="8759863943:AAHncy4_UyPHiidyTTLp5e2F9bFJCRTYqfI"

echo "🔍 Получение последних обновлений..."
echo ""

RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")

echo "Ответ от Telegram API:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "📋 Найдите в выводе \"chat\":{\"id\":-XXXXXXXXX}"
echo "Это и есть ваш Chat ID"
