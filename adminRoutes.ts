import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { config } from './environment';
import { runTheMealDBUpdate } from './themealdbUpdate';
import { runTheMealDBSeed } from './themealdbSeed';
import { runEnrichCuratedHealth } from './enrichCuratedHealth';
import { logger } from './logger';

const router = Router();

/**
 * Every route here triggers a long-running job against the database, so the
 * shared secret is the whole access control. Three copies of the same check
 * were three chances to get it subtly different; this is the one place.
 *
 * The comparison is constant-time. `a !== b` on strings short-circuits at the
 * first differing byte, so response timing leaks how much of a guess was
 * correct -- enough to recover a secret byte by byte given enough attempts.
 */
const requireAdminSecret = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.adminSecret) {
    // Fail closed: with no secret configured the endpoint is off, not open.
    res.status(501).json({ error: 'Admin endpoint disabled: ADMIN_SECRET not set' });
    return;
  }
  const provided = req.header('X-Admin-Secret') ?? '';
  const expected = config.adminSecret;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so compare lengths separately
  // and still run the comparison to keep the work constant.
  const equal = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!equal) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

/**
 * POST /api/admin/run-themealdb-seed
 * Fetch TheMealDB and INSERT as curated recipes (~300–600). Use when Shell is not available.
 * Skips if there are already 100+ curated recipes.
 * Requires header: X-Admin-Secret: <ADMIN_SECRET>
 * Returns 202 and runs in background.
 */
router.post('/run-themealdb-seed', requireAdminSecret, (_req: Request, res: Response) => {
  runTheMealDBSeed()
    .then(({ inserted, skipped }) => {
      logger.info('TheMealDB seed (admin): completed', { inserted, skipped });
    })
    .catch((err) => {
      logger.error('TheMealDB seed (admin): failed', err);
    });

  res.status(202).json({ message: 'TheMealDB seed started in background' });
});

/**
 * POST /api/admin/run-themealdb-update
 * Trigger TheMealDB re-fetch and update of existing curated recipes (by title).
 * Use when Shell is not available (e.g. Render free tier).
 * Requires header: X-Admin-Secret: <ADMIN_SECRET>
 * Returns 202 and runs the update in the background.
 */
router.post('/run-themealdb-update', requireAdminSecret, (_req: Request, res: Response) => {
  runTheMealDBUpdate()
    .then(({ updated, notFound }) => {
      logger.info('TheMealDB update (admin): completed', { updated, notFound });
    })
    .catch((err) => {
      logger.error('TheMealDB update (admin): failed', err);
    });

  res.status(202).json({ message: 'TheMealDB update started in background' });
});

/**
 * POST /api/admin/enrich-curated-health
 * Add health_benefits and health_concerns to curated recipes that don't have them (via AI).
 * Query param: limit (default 30) – max recipes to enrich per request.
 * Requires header: X-Admin-Secret: <ADMIN_SECRET>
 * Returns 202 and runs in background.
 */
router.post('/enrich-curated-health', requireAdminSecret, (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 30));

  runEnrichCuratedHealth(limit)
    .then(({ enriched, failed }) => {
      logger.info('Enrich curated health (admin): completed', { enriched, failed });
    })
    .catch((err) => {
      logger.error('Enrich curated health (admin): failed', err);
    });

  res.status(202).json({ message: 'Curated health enrichment started in background', limit });
});

export default router;
