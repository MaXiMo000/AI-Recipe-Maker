import { Router, Request, Response } from 'express';
import { config } from './environment';
import { runTheMealDBUpdate } from './themealdbUpdate';
import { logger } from './logger';

const router = Router();

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

export default router;
