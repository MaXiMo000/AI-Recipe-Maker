/**
 * The token middleware. authenticateToken is what stands between a request and
 * every user-scoped route, and optionalAuth deliberately lets anonymous
 * requests through -- so the important property is that it never *promotes* an
 * anonymous or forged request into an authenticated one.
 */
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-jwt-secret';

jest.mock('../environment', () => ({
  config: { jwtSecret: 'test-jwt-secret', jwtExpiry: '1h' },
}));
jest.mock('../logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

import { authenticateToken, optionalAuth, generateToken } from '../auth';

const build = (mw: express.RequestHandler) => {
  const app = express();
  app.get('/probe', mw, (req, res) => {
    res.json({ user: (req as express.Request & { user?: unknown }).user ?? null });
  });
  return app;
};

describe('authenticateToken', () => {
  it('refuses a request with no token', async () => {
    const res = await request(build(authenticateToken)).get('/probe');
    expect(res.status).toBe(401);
  });

  it('refuses a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: 'u1', email: 'a@b.c' }, 'not-the-real-secret');
    const res = await request(build(authenticateToken)).get('/probe').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(403);
  });

  it('refuses an expired token', async () => {
    const expired = jwt.sign({ id: 'u1', email: 'a@b.c' }, JWT_SECRET, { expiresIn: -10 });
    const res = await request(build(authenticateToken)).get('/probe').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(403);
  });

  it('refuses a structurally invalid token', async () => {
    const res = await request(build(authenticateToken)).get('/probe').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(403);
  });

  it('accepts a valid token and exposes the claims', async () => {
    const token = generateToken('user-123', 'real@example.com');
    const res = await request(build(authenticateToken)).get('/probe').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'user-123', email: 'real@example.com' });
  });

  it('does not echo the token back in a refusal', async () => {
    const forged = jwt.sign({ id: 'u1' }, 'not-the-real-secret');
    const res = await request(build(authenticateToken)).get('/probe').set('Authorization', `Bearer ${forged}`);
    expect(JSON.stringify(res.body)).not.toContain(forged);
  });
});

describe('optionalAuth', () => {
  it('lets an anonymous request through with no user', async () => {
    const res = await request(build(optionalAuth)).get('/probe');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('lets a forged token through but does NOT attach a user', async () => {
    // The dangerous failure would be treating an unverifiable token as
    // authenticated. Anonymous is fine; promoted is not.
    const forged = jwt.sign({ id: 'attacker', email: 'x@y.z' }, 'not-the-real-secret');
    const res = await request(build(optionalAuth)).get('/probe').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('attaches the user for a valid token', async () => {
    const token = generateToken('user-9', 'ok@example.com');
    const res = await request(build(optionalAuth)).get('/probe').set('Authorization', `Bearer ${token}`);
    expect(res.body.user).toMatchObject({ id: 'user-9' });
  });
});
