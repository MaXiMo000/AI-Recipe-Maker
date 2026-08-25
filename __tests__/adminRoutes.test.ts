/**
 * The admin endpoints trigger long-running jobs against the database, and a
 * shared header secret is the whole access control. This suite exists because
 * that check was previously copy-pasted into three handlers, and a check that
 * lives in three places is three chances to get it subtly different.
 *
 * Asserted in both directions: a wrong secret must be refused, and the right
 * one must get through. A guard that only ever refuses is not a guard either.
 */
import express from 'express';
import request from 'supertest';

const ADMIN_SECRET = 'test-admin-secret-value';

// The route module reads config at import time, and each job module reaches
// for the network and the database, so both are stubbed.
jest.mock('../environment', () => ({
  config: { adminSecret: 'test-admin-secret-value' },
}));
jest.mock('../themealdbSeed', () => ({ runTheMealDBSeed: jest.fn().mockResolvedValue({ inserted: 0, skipped: 0 }) }));
jest.mock('../themealdbUpdate', () => ({ runTheMealDBUpdate: jest.fn().mockResolvedValue({ updated: 0, skipped: 0 }) }));
jest.mock('../enrichCuratedHealth', () => ({ runEnrichCuratedHealth: jest.fn().mockResolvedValue({ enriched: 0, failed: 0 }) }));
jest.mock('../logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

import adminRoutes from '../adminRoutes';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const ROUTES = [
  '/api/admin/run-themealdb-seed',
  '/api/admin/run-themealdb-update',
  '/api/admin/enrich-curated-health',
];

describe('admin routes', () => {
  it.each(ROUTES)('%s rejects a request with no secret', async (route) => {
    const res = await request(app).post(route);
    expect(res.status).toBe(401);
  });

  it.each(ROUTES)('%s rejects a wrong secret of the same length', async (route) => {
    // Same length as the real one, so this cannot pass on a length check alone.
    const wrong = 'x'.repeat(ADMIN_SECRET.length);
    expect(wrong).toHaveLength(ADMIN_SECRET.length);
    const res = await request(app).post(route).set('X-Admin-Secret', wrong);
    expect(res.status).toBe(401);
  });

  it.each(ROUTES)('%s rejects a secret that is a prefix of the real one', async (route) => {
    // A byte-by-byte comparison that short-circuits would treat this as
    // "closer" than a random guess. It must be refused exactly the same way.
    const res = await request(app)
      .post(route)
      .set('X-Admin-Secret', ADMIN_SECRET.slice(0, -1));
    expect(res.status).toBe(401);
  });

  it.each(ROUTES)('%s accepts the correct secret', async (route) => {
    const res = await request(app).post(route).set('X-Admin-Secret', ADMIN_SECRET);
    expect(res.status).toBe(202);
  });

  it('does not leak the expected secret in a refusal', async () => {
    const res = await request(app).post(ROUTES[0]).set('X-Admin-Secret', 'nope');
    expect(JSON.stringify(res.body)).not.toContain(ADMIN_SECRET);
  });
});

describe('admin routes with ADMIN_SECRET unset', () => {
  it('fails closed with 501 rather than allowing the request', async () => {
    jest.resetModules();
    jest.doMock('../environment', () => ({ config: { adminSecret: undefined } }));
    const { default: routes } = await import('../adminRoutes');
    const off = express();
    off.use('/api/admin', routes);
    const res = await request(off).post('/api/admin/run-themealdb-seed');
    // 501, never 202: an endpoint with no secret configured is off, not open.
    expect(res.status).toBe(501);
  });
});
