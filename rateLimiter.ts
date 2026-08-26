import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from './environment';
import { logger } from './logger';
import { sendError } from './responseHelper';

const GLOBAL_API_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const GLOBAL_API_MAX = 150;

function rateLimitHandler(_req: Request, res: Response, _next: unknown, options: { windowMs?: number; message?: string }): void {
  const retryAfterSec = options.windowMs ? Math.ceil(options.windowMs / 1000) : 900;
  if (!res.headersSent) {
    res.setHeader('Retry-After', String(retryAfterSec));
    sendError(res, options.message ?? 'Too many requests, please try again later', 429);
  }
}

/**
 * Global API rate limiter: apply to all /api routes (e.g. 150 req/15 min per IP).
 */
export const globalApiLimiter = rateLimit({
  windowMs: GLOBAL_API_WINDOW_MS,
  max: GLOBAL_API_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Standard rate limiter for most endpoints
 */
export const standardLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for AI generation endpoints
 * (more expensive operations)
 */
export const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI generations per 15 minutes
  message: 'Too many recipe generation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn('AI generation rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    rateLimitHandler(req, res, _next, { ...options, message: 'Too many recipe generation requests, please try again later.' });
  },
});

/**
 * Auth rate limiter for login/register endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
