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
 *
 * Both stores count by *incrementing first and reading the result*, never by
 * reading, comparing and then writing. Read-compare-write is three round trips
 * with two gaps in them, and every concurrent request lands in those gaps: with
 * a cap of five, twenty requests sent together all read the same 0, all decide
 * they are under the limit, and twenty paid generations happen. Measured — it
 * was 20 of 20, on both paths. An atomic increment cannot be interleaved, so
 * the Nth caller is the only one that sees N.
 *
 * A refused request still increments. The counter therefore counts attempts
 * rather than generations, which overstates usage for somebody hammering a
 * closed door and leaves the decision — is this attempt over the line — exactly
 * right. Undercounting is the direction that costs money.
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
      // INCR is atomic and returns the new value, so this caller's number is
      // its own. `> LIMIT` rather than `>=`, because the count is now
      // post-increment: the LIMIT-th request reads exactly LIMIT and is the
      // last one allowed through.
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 86400 * 2); // 2 days TTL
      }
      if (count > LIMIT) {
        logger.warn('AI daily limit exceeded', { userId, date, count, limit: LIMIT });
        res.setHeader('Retry-After', '86400'); // 24h in seconds
        sendError(
          res,
          `Daily AI usage limit reached (${LIMIT} per day). Resets at midnight UTC.`,
          429
        );
        return;
      }
      next();
      return;
    }
  } catch (err) {
    logger.error('Redis AI daily limit check failed', err);
    // Fall through to DB
  }

  try {
    // One statement, not a SELECT and then an INSERT. `ON CONFLICT DO UPDATE`
    // takes a row lock on the conflicting row, so concurrent upserts for one
    // (user, day) serialise and RETURNING hands each caller a distinct count.
    // The primary key on (user_id, usage_date) is what makes that true.
    const result = await query(
      `INSERT INTO ai_usage_daily (user_id, usage_date, count)
       VALUES ($1, $2::date, 1)
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET count = ai_usage_daily.count + 1
       RETURNING count`,
      [userId, date]
    );
    const count = Number(result.rows[0]?.count ?? 0);
    if (count > LIMIT) {
      logger.warn('AI daily limit exceeded', { userId, date, count, limit: LIMIT });
      res.setHeader('Retry-After', '86400');
      sendError(
        res,
        `Daily AI usage limit reached (${LIMIT} per day). Resets at midnight UTC.`,
        429
      );
      return;
    }
    next();
  } catch (err) {
    logger.error('DB AI daily limit check failed', err);
    sendError(res, 'Unable to check usage limit. Please try again.', 503);
  }
}
