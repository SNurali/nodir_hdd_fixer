import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

export const ThrottleShort = () =>
  applyDecorators(UseGuards(ThrottlerGuard), Throttle({ short: { limit: 3, ttl: 1000 } }));

export const ThrottleMedium = () =>
  applyDecorators(UseGuards(ThrottlerGuard), Throttle({ medium: { limit: 30, ttl: 60000 } }));

export const ThrottleLong = () =>
  applyDecorators(UseGuards(ThrottlerGuard), Throttle({ long: { limit: 500, ttl: 3600000 } }));

export const ThrottleAuth = (limit = 5, ttl = 60000) =>
  applyDecorators(UseGuards(ThrottlerGuard), Throttle({ auth: { limit, ttl } }));
