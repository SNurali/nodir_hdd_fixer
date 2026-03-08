import { Logger } from '@nestjs/common';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

// Serverless detection: Vercel, AWS Lambda, etc.
// Check at module load time AND runtime
const checkIsServerless = () => {
  try {
    const cwd = process.cwd();
    if (cwd.includes('/var/task') || cwd.includes('/vercel')) return true;
  } catch (e) {}
  return process.env.NODE_ENV === 'production' ||
         !!process.env.VERCEL || 
         !!process.env.AWS_LAMBDA_FUNCTION_NAME || 
         !!process.env.CF_PAGES;
};

// In serverless, we can only write to stdout (file system is read-only or ephemeral)
// Check lazily to ensure process.env is available
const getLogDir = () => {
  if (checkIsServerless()) return null;
  return path.join(process.cwd(), 'logs');
};

// Create file streams only if we have a writable log directory
const getFileStreams = () => {
  // Aggressive check: NEVER write to files in production/serverless to avoid EROFS / ENOENT errors
  if (process.env.NODE_ENV === 'production' || checkIsServerless()) {
    return [];
  }

  try {
    const logDir = getLogDir();
    if (!logDir) return [];
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return [
      {
        level: 'info',
        stream: pino.destination({
          dest: path.join(logDir, 'app.log'),
          minLength: 4096,
          sync: false,
        }),
      },
      {
        level: 'error',
        stream: pino.destination({
          dest: path.join(logDir, 'error.log'),
          minLength: 4096,
          sync: false,
        }),
      },
    ];
  } catch (error) {
    // If we can't create log files, fall back to stdout only
    console.warn('Failed to create log directory, using stdout only:', error);
    return [];
  }
};

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: ['password', 'secret', 'token', 'authorization', 'cookie'],
      censor: '**REDACTED**',
    },
  },
  pino.multistream([
    ...getFileStreams(),
    {
      level: 'info',
      stream: process.stdout,
    },
  ]),
);

export const createLogger = (context: string) => {
  const nestLogger = new Logger(context);
  return {
    log: (message: string, meta?: any) => 
      logger.info({ context, ...meta }, message),
    error: (message: string, meta?: any) => {
      logger.error({ context, ...meta }, message);
      nestLogger.error(message, meta);
    },
    warn: (message: string, meta?: any) => 
      logger.warn({ context, ...meta }, message),
    debug: (message: string, meta?: any) => 
      logger.debug({ context, ...meta }, message),
  };
};

export default logger;
