import { Router, Request, Response } from 'express';
import { config } from './environment';
import { runTheMealDBUpdate } from './themealdbUpdate';
import { runTheMealDBSeed } from './themealdbSeed';
import { runEnrichCuratedHealth } from './enrichCuratedHealth';
import { logger } from './logger';

const router = Router();

/**
 * POST /api/admin/run-themealdb-seed
 * Fetch TheMealDB and INSERT as curated recipes (~300–600). Use when Shell is not available.
 * Skips if there are already 100+ curated recipes.
 * Requires header: X-Admin-Secret: <ADMIN_SECRET>
 * Returns 202 and runs in background.
 */
router.post('/run-themealdb-seed', (req: Request, res: Response) => {
  if (!config.adminSecret) {
    res.status(501).json({ error: 'Admin endpoint disabled: ADMIN_SECRET not set' });
    return;
  }
  const secret = req.header('X-Admin-Secret');
  if (secret !== config.adminSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

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
router.post('/run-themealdb-update', (req: Request, res: Response) => {
  if (!config.adminSecret) {
    res.status(501).json({ error: 'Admin endpoint disabled: ADMIN_SECRET not set' });
    return;
  }
  const secret = req.header('X-Admin-Secret');
  if (secret !== config.adminSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

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
router.post('/enrich-curated-health', (req: Request, res: Response) => {
  if (!config.adminSecret) {
    res.status(501).json({ error: 'Admin endpoint disabled: ADMIN_SECRET not set' });
    return;
  }
  const secret = req.header('X-Admin-Secret');
  if (secret !== config.adminSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
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
