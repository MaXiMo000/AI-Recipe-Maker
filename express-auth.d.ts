/**
 * Augment Express Request so that req.user is typed for our app.
 * - After authenticateToken: req.user = { id, email } (JWT payload).
 * - After passport Google callback: req.user = { id, email, token, user } (so AuthRequest is satisfied).
 */
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      /** Set by passport Google strategy only */
      token?: string;
      /** Set by passport Google strategy only */
      user?: { id: string; email: string; fullName: string | null };
    }
  }
}

export {};
