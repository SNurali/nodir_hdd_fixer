#!/bin/bash
# HDD Fixer - Startup Script

cd /home/yoyo/nodir_hdd_fixer

echo "🚀 Starting HDD Fixer..."

# Check Docker containers
if ! docker ps | grep -q hdd_fixer; then
    echo "📦 Starting Docker containers..."
    docker-compose up -d
    sleep 5
fi

# Check if API is running
if ! pgrep -f "node.*main.js" > /dev/null; then
    echo "⚙️  Starting API server..."
    nohup node apps/api/dist/main.js > /tmp/api.log 2>&1 &
    sleep 5
fi

# Check Nginx
if ! service nginx status | grep -q "is running"; then
    echo "🌐 Starting Nginx..."
    service nginx start
fi

echo ""
echo "✅ HDD Fixer is running!"
echo ""
echo "📍 API:      http://195.158.24.137/v1/health"
echo "📚 Swagger:  http://195.158.24.137/api/docs"
echo "🔧 Logs:     tail -f /tmp/api.log"
echo ""
