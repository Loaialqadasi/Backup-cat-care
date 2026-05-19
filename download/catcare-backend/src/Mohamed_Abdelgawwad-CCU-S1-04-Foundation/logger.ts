import pino from 'pino';
import { env } from './env.js';

// debug in dev, info in prod — keeps logs clean
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug'
});
