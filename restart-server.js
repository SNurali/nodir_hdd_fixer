#!/usr/bin/env node

/**
 * Скрипт для запуска API с авто-перезапуском при падении
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logLine.trim());
    fs.appendFileSync(path.join(logDir, 'restart-manager.log'), logLine);
}

const logger = {
    log: (msg) => log('INFO', msg),
    warn: (msg) => log('WARN', msg),
    error: (msg) => log('ERROR', msg),
};

const MAX_RESTARTS = 5;
const RESTART_DELAY = 3000; // 3 секунды
let restartCount = 0;
let lastRestartTime = Date.now();

function startApp() {
    logger.log(`🚀 Запуск приложения... (попытка ${restartCount + 1})`);
    
    const child = spawn('node', ['apps/api/dist/main.js'], {
        stdio: 'inherit',
        env: process.env,
    });

    child.on('error', (error) => {
        logger.error(`❌ Ошибка запуска: ${error.message}`);
        process.exit(1);
    });

    child.on('exit', (code, signal) => {
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTime;

        // Если приложение упало быстрее чем через 5 секунд после запуска
        if (timeSinceLastRestart < 5000) {
            restartCount++;
            logger.warn(`⚠️ Приложение упало быстро (код: ${code}, сигнал: ${signal})`);

            if (restartCount >= MAX_RESTARTS) {
                logger.error('❌ Слишком много перезапусков. Выход...');
                process.exit(1);
            }

            logger.log(`🔄 Перезапуск через ${RESTART_DELAY / 1000} секунд...`);
            setTimeout(() => {
                lastRestartTime = Date.now();
                startApp();
            }, RESTART_DELAY);
        } else {
            // Нормальный выход
            if (code === 0) {
                logger.log('✅ Приложение остановлено');
            } else {
                logger.warn(`⚠️ Приложение остановлено с кодом ${code}`);
                restartCount = 0; // Сброс счетчика при нормальном времени работы
                logger.log('🔄 Перезапуск...');
                startApp();
            }
        }
    });
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
    logger.log('👋 Получен SIGINT, завершение работы...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.log('👋 Получен SIGTERM, завершение работы...');
    process.exit(0);
});

// Запуск
startApp();
