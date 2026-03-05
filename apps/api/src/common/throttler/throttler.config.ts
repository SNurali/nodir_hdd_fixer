import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000, // 1 second
      limit: 3, // 3 requests per second
    },
    {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 30, // 30 requests per minute
    },
    {
      name: 'long',
      ttl: 3600000, // 1 hour
      limit: 500, // 500 requests per hour
    },
  ],
  skipIf: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    // Skip rate limiting for health checks
    if (req.url.includes('/health')) return true;
    
    // Skip for Swagger docs
    if (req.url.includes('/api/docs')) return true;
    
    return false;
  },
};

export const throttleConfigByRoute = {
  auth: {
    login: { limit: 5, ttl: 60000 }, // 5 login attempts per minute
    register: { limit: 3, ttl: 60000 }, // 3 registrations per minute
    refresh: { limit: 10, ttl: 60000 }, // 10 token refreshes per minute
  },
  orders: {
    create: { limit: 10, ttl: 60000 }, // 10 orders per minute
    update: { limit: 30, ttl: 60000 }, // 30 updates per minute
  },
  messages: {
    send: { limit: 20, ttl: 60000 }, // 20 messages per minute
  },
};
