/**
 * The daily AI cap is the only thing standing between one account and an
 * unbounded Anthropic bill, so the interesting question is not "does it refuse
 * the sixteenth request" but "does it refuse the sixteenth of sixteen sent at
 * once".
 *
 * Both stores are asserted, because the middleware silently falls back from
 * Redis to Postgres and a cap that holds on one path and not the other is a
 * cap that depends on whether Redis happened to be up.
 */
import { Response } from 'express';

const LIMIT = 5;

jest.mock('../environment', () => ({
  config: { aiDailyLimitPerUser: 5 },
}));
jest.mock('../logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// A Redis stand-in that behaves like the real client in the one way that
// matters here: every command is a promise, so concurrent callers interleave
// between the read and the write exactly as they do over a socket.
const store = new Map<string, number>();
const expires = new Map<string, number>();
const redisMock = {
  get: jest.fn(async (k: string) => {
    await Promise.resolve();
    const v = store.get(k);
    return v === undefined ? null : String(v);
  }),
  incr: jest.fn(async (k: string) => {
    await Promise.resolve();
    const next = (store.get(k) ?? 0) + 1;
    store.set(k, next);
    return next;
  }),
  expire: jest.fn(async (k: string, s: number) => {
    expires.set(k, s);
    return true;
  }),
};

let redisUp = true;
jest.mock('../redis', () => ({
  isRedisConnected: () => redisUp,
  getRedisClient: () => redisMock,
}));

// The Postgres fallback, with the same interleaving property.
const rows = new Map<string, number>();
const queryMock = jest.fn(async (sql: string, params: unknown[]) => {
  await Promise.resolve();
  const key = `${params[0]}:${params[1]}`;
  if (sql.includes('SELECT')) {
    const c = rows.get(key);
    return { rows: c === undefined ? [] : [{ count: c }] };
  }
  const next = (rows.get(key) ?? 0) + 1;
  rows.set(key, next);
  return { rows: [{ count: next }] };
});
jest.mock('../database', () => ({ query: (...a: unknown[]) => queryMock(...(a as [string, unknown[]])) }));

jest.mock('../responseHelper', () => ({
  sendError: (res: { status: (n: number) => { json: (b: unknown) => void } }, msg: string, code: number) => {
    res.status(code).json({ error: msg });
  },
}));

import { checkAiDailyLimit } from '../aiDailyLimit';

/** A request that only carries what the middleware reads. */
const reqFor = (userId: string) => ({ user: { id: userId } }) as never;

function fakeRes() {
  const out = { code: 0, sent: false };
  const res = {
    setHeader: jest.fn(),
    status(c: number) { out.code = c; return this; },
    json() { out.sent = true; },
  };
  return { res: res as unknown as Response, out };
}

/** Fire `n` requests without awaiting between them, and report how many the
 *  middleware let through to the handler. */
async function stampede(userId: string, n: number) {
  let allowed = 0;
  await Promise.all(
    Array.from({ length: n }, () => {
      const { res } = fakeRes();
      return checkAiDailyLimit(reqFor(userId), res, () => { allowed += 1; });
    }),
  );
  return allowed;
}

beforeEach(() => {
  store.clear();
  expires.clear();
  rows.clear();
  redisUp = true;
});

describe('checkAiDailyLimit', () => {
  it('allows the first LIMIT requests and refuses the next, one at a time', async () => {
    for (let i = 0; i < LIMIT; i++) {
      let called = false;
      const { res } = fakeRes();
      await checkAiDailyLimit(reqFor('u1'), res, () => { called = true; });
      expect(called).toBe(true);
    }
    const { res, out } = fakeRes();
    let called = false;
    await checkAiDailyLimit(reqFor('u1'), res, () => { called = true; });
    expect(called).toBe(false);
    expect(out.code).toBe(429);
  });

  it('holds the cap when the whole day of requests arrives at once (Redis)', async () => {
    // The bug this pins: read, compare, then write is three awaits with two
    // gaps in them. Twenty callers all read the same 0 and all decide they are
    // under the limit, and twenty paid generations happen against a cap of five.
    const allowed = await stampede('u2', 20);
    expect(allowed).toBe(LIMIT);
  });

  it('holds the cap when the whole day of requests arrives at once (Postgres)', async () => {
    redisUp = false;
    const allowed = await stampede('u3', 20);
    expect(allowed).toBe(LIMIT);
  });

  it('counts each user separately', async () => {
    expect(await stampede('alice', 3)).toBe(3);
    expect(await stampede('bob', 3)).toBe(3);
  });

  it('gives the counter a TTL so a day of keys does not live forever', async () => {
    await stampede('u4', 3);
    const key = [...expires.keys()].find((k) => k.includes('u4'));
    expect(key).toBeDefined();
    expect(expires.get(key as string)).toBeGreaterThan(86400);
  });

  it('refuses an unauthenticated request rather than counting it', async () => {
    const { res, out } = fakeRes();
    let called = false;
    await checkAiDailyLimit({} as never, res, () => { called = true; });
    expect(called).toBe(false);
    expect(out.code).toBe(401);
    expect(store.size).toBe(0);
  });
});
