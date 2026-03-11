#!/bin/bash
# ===========================================
# HDD Fixer - Database Initialization Script
# ===========================================
# Скрипт для инициализации БД при старте Docker контейнера
# Создает таблицу order_lifecycle с колонками comments, comments_en, comments_uz
# ===========================================

set -e

POSTGRES_USER="${POSTGRES_USER:-hdd_fixer}"
POSTGRES_DB="${POSTGRES_DB:-hdd_fixer_db}"

echo "🔧 Initializing database for $POSTGRES_DB..."

# Создаем таблицу order_lifecycle если не существует
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Таблица для жизненного цикла заказов
    CREATE TABLE IF NOT EXISTS order_lifecycle (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        comments TEXT,
        comments_en TEXT,
        comments_uz TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Индексы для производительности
    CREATE INDEX IF NOT EXISTS idx_order_lifecycle_order_id ON order_lifecycle(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_lifecycle_status ON order_lifecycle(status);
    CREATE INDEX IF NOT EXISTS idx_order_lifecycle_created_at ON order_lifecycle(created_at);

    -- Таблица пользователей (admin user для тестирования)
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Индекс для email
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EOSQL

echo "✅ Database initialization complete!"
