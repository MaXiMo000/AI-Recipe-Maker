import { Router, Request, Response, RequestHandler } from 'express';
import { authController } from './authController';
import { authenticateToken } from './auth';
import { authLimiter, standardLimiter } from './rateLimiter';
import { config } from './environment';
import { isGoogleOAuthConfigured, getPassport } from './passportGoogle';

const router = Router();

// Wrap so router receives RequestHandler; avoids Express Request.user vs AuthRequest type conflict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap(fn: any): RequestHandler {
  return fn;
}

router.post('/register', authLimiter, wrap(authController.register));
router.post('/login', authLimiter, wrap(authController.login));
router.post('/logout', authenticateToken as RequestHandler, wrap(authController.logout));
router.get('/me', authenticateToken as RequestHandler, wrap(authController.getCurrentUser));
router.put('/profile', authenticateToken as RequestHandler, standardLimiter, wrap(authController.updateProfile));

// Google OAuth: redirect to Google (only when configured and passport available)
router.get('/google', authLimiter, (req: Request, res: Response) => {
  const frontendUrl = config.frontendUrl;
  if (!isGoogleOAuthConfigured()) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  const passport = getPassport();
  if (!passport) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, () => {});
});

// Google OAuth callback: exchange code, find/create user, redirect to frontend with token
router.get(
  '/google/callback',
  authLimiter,
  (req: Request, res: Response, next: () => void) => {
    const frontendUrl = config.frontendUrl;
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    const passport = getPassport();
    if (!passport) {
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    passport.authenticate('google', { session: false }, (err: Error | null, payload: { token: string; user: { id: string; email: string; fullName: string | null } } | undefined) => {
      if (err) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      if (!payload?.token) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      res.redirect(`${frontendUrl}/google-auth?token=${encodeURIComponent(payload.token)}`);
    })(req, res, next);
  }
);

export default router;
