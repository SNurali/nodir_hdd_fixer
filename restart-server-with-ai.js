#!/usr/bin/env node

/**
 * Скрипт для запуска API с авто-перезапуском и AI-помощником при падении
 * При критических ошибках запускает Qwen для анализа и исправления
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

const MAX_RESTARTS_BEFORE_AI = 3;
const RESTART_DELAY = 3000;
const AI_HELP_DELAY = 5000;
let restartCount = 0;
let lastRestartTime = Date.now();
let consecutiveCrashes = [];

function getErrorDetails(exitCode, signal) {
    const timestamp = new Date().toISOString();
    return {
        timestamp,
        exitCode,
        signal,
        crashes: consecutiveCrashes.slice(-10),
        appLog: readLastLines(path.join(logDir, 'app.log'), 50),
        errorLog: readLastLines(path.join(logDir, 'error.log'), 50),
    };
}

function readLastLines(filePath, lines) {
    try {
        if (!fs.existsSync(filePath)) return 'Файл не найден';
        const content = fs.readFileSync(filePath, 'utf-8');
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
    } catch (e) {
        return `Ошибка чтения: ${e.message}`;
    }
}

function saveCrashReport(errorDetails) {
    const reportPath = path.join(logDir, `crash-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(errorDetails, null, 2));
    return reportPath;
}

function runAiHelper(errorDetails, reportPath) {
    logger.log('🤖 Запуск Qwen AI для анализа ошибки...');
    
    const prompt = `
🚨 КРИТИЧЕСКАЯ ОШИБКА ПРИЛОЖЕНИЯ 🚨

Приложение nodir_hdd_fixer падает при запуске. Пожалуйста, проанализируй и исправь!

📊 Детали падения:
- Exit Code: ${errorDetails.exitCode}
- Signal: ${errorDetails.signal}
- Время: ${errorDetails.timestamp}

📁 Путь к отчету: ${reportPath}

📋 Последние логи (app.log):
${errorDetails.appLog}

📋 Последние ошибки (error.log):
${errorDetails.errorLog}

❓ ЗАДАЧА:
1. Проанализируй логи и найди причину падения
2. Исправь ошибку в коде
3. Пересобери проект (npm run build:api)
4. Сообщи что было исправлено

⚠️ Это автоматический запрос от restart-server.js
`.trim();

    const qwenProcess = spawn('node', ['qwen-agent.js'], {
        stdio: 'inherit',
        env: { ...process.env, QWEN_INITIAL_PROMPT: prompt },
    });

    qwenProcess.on('close', (code) => {
        logger.log(`Qwen завершил работу (код: ${code})`);
        if (code === 0) {
            logger.log('✅ AI помог исправить ошибку, перезапуск...');
            setTimeout(() => {
                restartCount = 0;
                consecutiveCrashes = [];
                startApp();
            }, AI_HELP_DELAY);
        } else {
            logger.warn('⚠️ Qwen не смог исправить ошибку автоматически');
        }
    });
}

function startApp() {
    logger.log(`🚀 Запуск приложения... (попытка ${restartCount + 1})`);
    
    const child = spawn('node', ['apps/api/dist/main.js'], {
        stdio: 'inherit',
        env: process.env,
    });

    child.on('error', (error) => {
        logger.error(`❌ Ошибка запуска: ${error.message}`);
        const errorDetails = getErrorDetails(-1, 'error');
        const reportPath = saveCrashReport(errorDetails);
        consecutiveCrashes.push({ error: error.message, time: Date.now() });
        
        // Проверяем, не слишком ли много ошибок
        if (consecutiveCrashes.length >= MAX_RESTARTS_BEFORE_AI) {
            // Если ошибка не EADDRINUSE, запускаем AI
            if (!error.message.includes('EADDRINUSE')) {
                logger.error('🤖 Слишком много ошибок, запускаю Qwen AI для помощи...');
                runAiHelper(errorDetails, reportPath);
                return;
            } else {
                logger.error('❌ Порт занят. Попробуйте освободить порт 3004 вручную');
                process.exit(1);
            }
        }
        
        process.exit(1);
    });

    child.on('exit', (code, signal) => {
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTime;

        if (timeSinceLastRestart < 5000) {
            restartCount++;
            consecutiveCrashes.push({ code, signal, time: now });
            
            logger.warn(`⚠️ Приложение упало быстро (код: ${code}, сигнал: ${signal})`);

            if (restartCount >= MAX_RESTARTS_BEFORE_AI) {
                const errorDetails = getErrorDetails(code, signal);
                const reportPath = saveCrashReport(errorDetails);
                
                // Проверяем, не EADDRINUSE ли это (код 1 с портом)
                const lastCrash = consecutiveCrashes[consecutiveCrashes.length - 1];
                const isAddrInUse = lastCrash.code === 1 && lastCrash.signal === null;
                
                if (isAddrInUse) {
                    logger.error('❌ Слишком много перезапусков подряд');
                    logger.error('⚠️ Порт 3004 занят другим процессом!');
                    logger.error('💡 Решение:');
                    logger.error('   1. Остановите старый процесс: pkill -f "node.*main.js"');
                    logger.error('   2. Освободите порт: lsof -ti:3004 | xargs kill -9');
                    logger.error('   3. Запустите снова');
                    // Выходим без перезапуска
                    process.exit(1);
                } else {
                    logger.error('❌ Слишком много перезапусков подряд');
                    logger.log('🤖 Запускаю Qwen AI для анализа и исправления...');
                    runAiHelper(errorDetails, reportPath);
                    return;
                }
            }

            logger.log(`🔄 Перезапуск через ${RESTART_DELAY / 1000} секунд...`);
            setTimeout(() => {
                lastRestartTime = Date.now();
                startApp();
            }, RESTART_DELAY);
        } else {
            // Приложение работало больше 5 секунд - это нормальный выход
            if (code === 0) {
                logger.log('✅ Приложение остановлено пользователем');
                process.exit(0);
            } else {
                logger.warn(`⚠️ Приложение остановлено с кодом ${code}`);
                // Сбрасываем счетчики после нормальной работы
                restartCount = 0;
                consecutiveCrashes = [];
                logger.log('🔄 Перезапуск...');
                startApp();
            }
        }
    });
}

process.on('SIGINT', () => {
    logger.log('👋 Получен SIGINT, завершение работы...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.log('👋 Получен SIGTERM, завершение работы...');
    process.exit(0);
});

logger.log('🔧 Restart Manager с AI-помощником запущен');
logger.log('📊 Максимум перезапусков до AI: ' + MAX_RESTARTS_BEFORE_AI);
startApp();
