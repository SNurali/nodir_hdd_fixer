import { Logger } from '@nestjs/common';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: ['password', 'secret', 'token', 'authorization', 'cookie'],
      censor: '**REDACTED**',
    },
  },
  pino.multistream([
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
