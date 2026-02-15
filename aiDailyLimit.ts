import { Response, NextFunction } from 'express';
import { config } from './environment';
import { logger } from './logger';
import { isRedisConnected } from './redis';
import { getRedisClient } from './redis';
import { query } from './database';
import { sendError } from './responseHelper';
import { AuthRequest } from './auth';

const LIMIT = config.aiDailyLimitPerUser;

function todayUTC(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Middleware: enforces per-user daily AI usage limit.
 * Must run after authenticateToken (so req.user is set).
 * Uses Redis when available, otherwise DB (ai_usage_daily table).
 */
export async function checkAiDailyLimit(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const date = todayUTC();
  const key = `ai_daily:${userId}:${date}`;

  try {
    if (isRedisConnected()) {
      const redis = getRedisClient();
      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;
      if (count >= LIMIT) {
        logger.warn('AI daily limit exceeded', { userId, date, count, limit: LIMIT });
        res.setHeader('Retry-After', '86400'); // 24h in seconds
        sendError(
          res,
          `Daily AI usage limit reached (${LIMIT} per day). Resets at midnight UTC.`,
          429
        );
        return;
      }
      await redis.incr(key);
      if (count === 0) {
        await redis.expire(key, 86400 * 2); // 2 days TTL
      }
      next();
      return;
    }
  } catch (err) {
    logger.error('Redis AI daily limit check failed', err);
    // Fall through to DB
  }

  try {
    const result = await query(
      `SELECT count FROM ai_usage_daily WHERE user_id = $1 AND usage_date = $2::date`,
      [userId, date]
    );
    const count = Number(result.rows[0]?.count ?? 0);
    if (count >= LIMIT) {
      logger.warn('AI daily limit exceeded', { userId, date, count, limit: LIMIT });
      res.setHeader('Retry-After', '86400');
      sendError(
        res,
        `Daily AI usage limit reached (${LIMIT} per day). Resets at midnight UTC.`,
        429
      );
      return;
    }
    await query(
      `INSERT INTO ai_usage_daily (user_id, usage_date, count)
       VALUES ($1, $2::date, 1)
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET count = ai_usage_daily.count + 1`,
      [userId, date]
    );
    next();
  } catch (err) {
    logger.error('DB AI daily limit check failed', err);
    sendError(res, 'Unable to check usage limit. Please try again.', 503);
  }
}
