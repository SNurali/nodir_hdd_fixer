#!/usr/bin/env node

/**
 * Qwen CLI Agent - Работа с моделями Alibaba DashScope
 * 
 * Использование:
 *   node qwen-agent.js                    # Интерактивный режим
 *   node qwen-agent.js -m qwen-plus       # Выбрать модель
 *   node qwen-agent.js "Ваш вопрос"       # Один запрос
 */

import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';

// Загрузка переменных окружения
dotenv.config();

// Конфигурация
const CONFIG = {
  apiKey: process.env.DASHSCOPE_API_KEY,
  endpoint: process.env.DASHSCOPE_ENDPOINT || 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  
  // Все доступные модели Qwen
  models: {
    'qwen-max': 'Qwen-Max — максимальная производительность, сложный интеллект',
    'qwen-plus': 'Qwen-Plus — баланс цены и качества (RECOMMENDED)',
    'qwen-turbo': 'Qwen-Turbo — быстрая и недорогая',
    'qwen-long': 'Qwen-Long — для длинных контекстов (до 10M токенов)',
    'qwen-coder': 'Qwen-Coder — специализация на коде',
    'qwen-vl-max': 'Qwen-VL-Max — мультимодальная (изображения + текст)',
    'qwen-vl-plus': 'Qwen-VL-Plus — мультимодальная баланс',
    'qwen-math-plus': 'Qwen-Math-Plus — математические задачи',
    'qwen-reranker': 'Qwen-Reranker — ранжирование результатов',
  },
  
  // Модель по умолчанию
  defaultModel: 'qwen-plus',
  
  // Параметры генерации
  parameters: {
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.8,
    stream: false,
  },
};

// Проверка API ключа
if (!CONFIG.apiKey) {
  console.error('❌ Ошибка: Не найден DASHSCOPE_API_KEY в .env файле');
  console.error('   Добавьте ключ в файл .env:');
  console.error('   DASHSCOPE_API_KEY=sk-your-key-here');
  process.exit(1);
}

// Создание HTTP клиента
const apiClient = axios.create({
  baseURL: CONFIG.endpoint,
  headers: {
    'Authorization': `Bearer ${CONFIG.apiKey}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Отправка запроса к Qwen API
 */
async function callQwen(model, messages, parameters = {}) {
  try {
    const response = await apiClient.post('', {
      model,
      input: { messages },
      parameters: { ...CONFIG.parameters, ...parameters },
    });
    
    return {
      success: true,
      content: response.data.output?.text || response.data.output?.choices?.[0]?.message?.content,
      usage: response.data.usage,
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: `API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
      };
    }
    return {
      success: false,
      error: `Network Error: ${error.message}`,
    };
  }
}

/**
 * Отображение списка моделей
 */
function showModels() {
  console.log('\n📋 Доступные модели Qwen:\n');
  Object.entries(CONFIG.models).forEach(([model, desc]) => {
    const isDefault = model === CONFIG.defaultModel ? ' (по умолчанию)' : '';
    console.log(`   ${model === CONFIG.defaultModel ? '👉' : '  '} ${model}${isDefault}`);
    console.log(`      ${desc}\n`);
  });
}

/**
 * Интерактивный режим чата
 */
async function interactiveChat(selectedModel = CONFIG.defaultModel) {
  console.log('\n🤖 Qwen CLI Agent запущен!');
  console.log(`📌 Модель: ${selectedModel}`);
  console.log('📝 Команды:');
  console.log('   /models  — показать список моделей');
  console.log('   /model <name> — сменить модель (например: /model qwen-max)');
  console.log('   /clear   — очистить историю чата');
  console.log('   /exit    — выйти\n');
  
  let chatHistory = [
    { role: 'system', content: 'Вы полезный ассистент. Отвечайте подробно и точно.' }
  ];
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const prompt = () => {
    rl.question(`\n🧑 Вы (${selectedModel}): `, async (userInput) => {
      const trimmedInput = userInput.trim();
      
      // Обработка команд
      if (trimmedInput === '/exit' || trimmedInput === '/quit') {
        console.log('\n👋 До свидания!');
        rl.close();
        return;
      }
      
      if (trimmedInput === '/models') {
        showModels();
        prompt();
        return;
      }
      
      if (trimmedInput === '/clear') {
        chatHistory = [chatHistory[0]]; // Сохраняем только system message
        console.log('🗑️ История чата очищена');
        prompt();
        return;
      }
      
      if (trimmedInput.startsWith('/model ')) {
        const newModel = trimmedInput.replace('/model ', '').trim();
        if (CONFIG.models[newModel]) {
          selectedModel = newModel;
          console.log(`✅ Модель изменена на: ${selectedModel}`);
        } else {
          console.log(`❌ Модель "${newModel}" не найдена. Используйте /models для списка.`);
        }
        prompt();
        return;
      }
      
      if (!trimmedInput) {
        prompt();
        return;
      }
      
      // Добавляем сообщение пользователя
      chatHistory.push({ role: 'user', content: trimmedInput });
      
      // Отправляем запрос
      console.log('\n⏳ Думаю...');
      const result = await callQwen(selectedModel, chatHistory);
      
      if (result.success) {
        console.log(`\n🤖 Qwen (${selectedModel}):\n${result.content}`);
        
        // Добавляем ответ в историю
        chatHistory.push({ role: 'assistant', content: result.content });
        
        // Показываем статистику использования
        if (result.usage) {
          console.log(`\n📊 Токены: вход=${result.usage.input_tokens}, выход=${result.usage.output_tokens}`);
        }
      } else {
        console.log(`\n❌ Ошибка: ${result.error}`);
      }
      
      prompt();
    });
  };
  
  prompt();
}

/**
 * Одиночный запрос (неинтерактивный режим)
 */
async function singleQuery(query, selectedModel = CONFIG.defaultModel) {
  console.log(`📌 Модель: ${selectedModel}`);
  console.log('⏳ Обрабатываю запрос...\n');
  
  const messages = [
    { role: 'system', content: 'Вы полезный ассистент.' },
    { role: 'user', content: query },
  ];
  
  const result = await callQwen(selectedModel, messages);
  
  if (result.success) {
    console.log('🤖 Ответ:\n');
    console.log(result.content);
    
    if (result.usage) {
      console.log(`\n📊 Токены: вход=${result.usage.input_tokens}, выход=${result.usage.output_tokens}`);
    }
  } else {
    console.log(`❌ Ошибка: ${result.error}`);
    process.exit(1);
  }
}

/**
 * Парсинг аргументов командной строки
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let model = CONFIG.defaultModel;
  let query = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-m' || args[i] === '--model') {
      model = args[i + 1] || CONFIG.defaultModel;
      i++;
    } else if (args[i] === '-l' || args[i] === '--list') {
      showModels();
      process.exit(0);
    } else if (args[i] === '-h' || args[i] === '--help') {
      console.log(`
🤖 Qwen CLI Agent — работа с моделями Alibaba DashScope

Использование:
  node qwen-agent.js                    # Интерактивный режим
  node qwen-agent.js "Ваш вопрос"       # Одиночный запрос
  node qwen-agent.js -m qwen-max        # Выбрать модель
  node qwen-agent.js -m qwen-plus "Вопрос"

Опции:
  -m, --model <name>   Выбрать модель (qwen-max, qwen-plus, qwen-turbo...)
  -l, --list           Показать список всех моделей
  -h, --help           Показать эту справку

Доступные модели:
  qwen-max      — максимальная производительность
  qwen-plus     — баланс цены и качества (рекомендуется)
  qwen-turbo    — быстрая и недорогая
  qwen-long     — для длинных контекстов
  qwen-coder    — для генерации кода
  qwen-vl-max   — мультимодальная (изображения + текст)
`);
      process.exit(0);
    } else {
      query = args[i];
    }
  }
  
  return { model, query };
}

// Запуск
const { model, query } = parseArgs();

if (!CONFIG.models[model]) {
  console.error(`❌ Модель "${model}" не найдена.`);
  console.error('   Используйте -l для списка моделей или -h для справки.');
  process.exit(1);
}

if (query) {
  // Одиночный запрос
  singleQuery(query, model);
} else {
  // Интерактивный режим
  interactiveChat(model);
}
