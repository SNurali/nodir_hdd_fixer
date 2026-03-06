#!/bin/bash

PM2_PATH="/home/mrnurali/.npm-global/lib/node_modules/pm2/bin/pm2"
PROJECT_DIR="/home/mrnurali/nodir_hdd_fixer"
PORT=3004

# Проверяем, занят ли порт
PORT_BUSY=$(lsof -ti :$PORT 2>/dev/null)

# Проверяем статус PM2
PM2_RUNNING=$($PM2_PATH list | grep -c "nodir-backend.*online" 2>/dev/null)

if [ -n "$PORT_BUSY" ]; then
    echo "⚠️  Порт $PORT занят (PID: $PORT_BUSY)"
    echo "Останавливаем backend..."
    
    if [ $PM2_RUNNING -gt 0 ]; then
        $PM2_PATH stop nodir-backend
        echo "✅ PM2 остановлен"
    else
        kill -9 $PORT_BUSY 2>/dev/null
        echo "✅ Процесс убит"
    fi
    
    sleep 1
    echo "🔄 Запускаем через PM2..."
    cd $PROJECT_DIR && $PM2_PATH start npm --name "nodir-backend" -- run start:api:ai
    echo "✅ Backend запущен в режиме PM2 (автоперезапуск)"
    echo ""
    echo "📊 Статус:"
    $PM2_PATH status nodir-backend
else
    echo "🔌 Порт $PORT свободен"
    
    if [ $PM2_RUNNING -gt 0 ]; then
        echo "🔄 Перезапускаем через PM2..."
        $PM2_PATH restart nodir-backend
    else
        echo "🚀 Запускаем через PM2..."
        cd $PROJECT_DIR && $PM2_PATH start npm --name "nodir-backend" -- run start:api:ai
    fi
    
    echo "✅ Backend запущен"
    echo ""
    echo "📊 Статус:"
    $PM2_PATH status nodir-backend
fi

echo ""
echo "📋 Логи: pm2 logs nodir-backend"
echo "🛑 Стоп: pm2 stop nodir-backend"
