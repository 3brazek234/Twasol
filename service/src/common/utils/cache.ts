import Redis from 'ioredis';
import { env } from '../../env';
import { logger } from './logger';

export const cache = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

cache.on('error', (err) => {
  logger.error({ err }, 'Redis cache connection error');
});

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  try {
    const cached = await cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ key, err }, 'Redis get error, falling back to fetcher');
  }

  const data = await fetcher();

  try {
    if (data) {
      await cache.setex(key, ttlSeconds, JSON.stringify(data));
    }
  } catch (err) {
    logger.warn({ key, err }, 'Redis set error');
  }

  return data;
}

export async function invalidateCachePrefix(prefix: string) {
  try {
    let cursor = '0';
    do {
      const result = await cache.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await cache.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.error({ prefix, err }, 'Redis invalidation error');
  }
}
