import { createClient, RedisClientType } from 'redis';
import { config } from './environment';
import { logger } from './logger';

const CACHE_TIMEOUT_MS = 5000;
const SCAN_COUNT = 100;
const SCAN_MAX_ITERATIONS = 100;

let redisClient: RedisClientType | null = null;

/**
 * Optional Redis at startup: on failure, log warning and run without cache.
 */
export const connectRedis = async (): Promise<void> => {
  try {
    const client = createClient({
      url: config.redisUrl,
    });

    client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await client.connect();
    redisClient = client as RedisClientType;
  } catch (error) {
    logger.warn('Redis connection failed; cache disabled.', error);
    redisClient = null;
  }
};

export function isRedisConnected(): boolean {
  return Boolean(redisClient?.isReady);
}

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Cache timeout')), ms)
    ),
  ]).catch(() => null);
}

// Cache utilities: resilient when Redis is down or slow; no throw from cache methods.
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisConnected() || !redisClient) return null;
    try {
      const value = await withTimeout(redisClient.get(key), CACHE_TIMEOUT_MS);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    if (!isRedisConnected() || !redisClient) return;
    try {
      await withTimeout(
        redisClient.setEx(key, ttlSeconds, JSON.stringify(value)),
        CACHE_TIMEOUT_MS
      );
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  },

  async del(key: string): Promise<void> {
    if (!isRedisConnected() || !redisClient) return;
    try {
      await withTimeout(redisClient.del(key), CACHE_TIMEOUT_MS);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  },

  /**
   * Delete keys matching pattern using SCAN (cursor-based), not KEYS.
   * Safety cap on iterations to avoid runaway loops.
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!isRedisConnected() || !redisClient) return;
    try {
      let cursor = 0;
      let iterations = 0;
      do {
        const reply = await withTimeout(
          redisClient.scan(cursor, { MATCH: pattern, COUNT: SCAN_COUNT }),
          CACHE_TIMEOUT_MS
        );
        if (reply == null) break;
        const { cursor: nextCursor, keys } = reply as { cursor: number; keys: string[] };
        cursor = nextCursor;
        if (keys.length > 0) {
          await withTimeout(redisClient.del(keys), CACHE_TIMEOUT_MS);
        }
        iterations++;
        if (iterations >= SCAN_MAX_ITERATIONS) {
          logger.warn(`delByPattern ${pattern} hit max iterations`);
          break;
        }
      } while (cursor !== 0);
    } catch (error) {
      logger.error(`Cache delByPattern error for ${pattern}:`, error);
    }
  },

  /** @deprecated Use delByPattern for new code. Kept for compatibility. */
  async delPattern(pattern: string): Promise<void> {
    return this.delByPattern(pattern);
  },
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};
