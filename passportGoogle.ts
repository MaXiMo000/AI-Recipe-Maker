import { query } from './database';
import { config } from './environment';
import { generateToken } from './auth';
import { logger } from './logger';

// Passport instance when loaded via require (optional dependency)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let passportInstance: any = null;

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    config.google.clientId &&
      config.google.clientSecret &&
      config.google.callbackUrl
  );
}

/** Returns the passport instance if available (passport and strategy were loaded). Use for optional Google OAuth. */
export function getPassport(): typeof passportInstance {
  return passportInstance;
}

/**
 * Initialize Google strategy and return passport for app.use(passport.initialize()).
 * Returns null if passport/passport-google-oauth20 are not installed (e.g. Docker volume stale).
 */
export function initPassportGoogle(): typeof passportInstance {
  if (!isGoogleOAuthConfigured()) {
    logger.info('Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL); sign-in with Google disabled');
    return null;
  }

  try {
    // Lazily required on purpose: Google OAuth is optional, and a static
    // import would make passport-google-oauth20 a hard dependency that
    // breaks startup when it is not installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const passport = require('passport');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId!,
          clientSecret: config.google.clientSecret!,
          callbackURL: config.google.callbackUrl!,
        },
        async (_accessToken: string, _refreshToken: string, profile: { id: string; emails?: { value: string }[]; displayName?: string }, done: (err: Error | null, user?: unknown) => void) => {
          try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;
            const displayName = profile.displayName ?? undefined;

            if (!email) {
              return done(new Error('Google profile missing email'), undefined);
            }

            let result = await query(
              'SELECT id, email, full_name FROM users WHERE google_id = $1',
              [googleId]
            );

            if (result.rows.length > 0) {
              const user = result.rows[0] as { id: string; email: string; full_name: string | null };
              const token = generateToken(user.id, user.email);
              logger.info('Google OAuth: existing user', { userId: user.id, email: user.email });
              return done(null, {
                id: user.id,
                email: user.email,
                token,
                user: { id: user.id, email: user.email, fullName: user.full_name },
              });
            }

            result = await query(
              'SELECT id, email, full_name FROM users WHERE email = $1',
              [email]
            );

            if (result.rows.length > 0) {
              const user = result.rows[0] as { id: string; email: string; full_name: string | null };
              await query(
                'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2',
                [googleId, user.id]
              );
              const token = generateToken(user.id, user.email);
              logger.info('Google OAuth: linked existing account', { userId: user.id, email: user.email });
              return done(null, {
                id: user.id,
                email: user.email,
                token,
                user: { id: user.id, email: user.email, fullName: user.full_name },
              });
            }

            const insertResult = await query(
              `INSERT INTO users (email, full_name, google_id, password_hash)
               VALUES ($1, $2, $3, NULL)
               RETURNING id, email, full_name`,
              [email, displayName || null, googleId]
            );

            const newUser = insertResult.rows[0] as { id: string; email: string; full_name: string | null };
            const token = generateToken(newUser.id, newUser.email);
            logger.info('Google OAuth: new user', { userId: newUser.id, email: newUser.email });
            return done(null, {
              id: newUser.id,
              email: newUser.email,
              token,
              user: { id: newUser.id, email: newUser.email, fullName: newUser.full_name },
            });
          } catch (err) {
            logger.error('Google OAuth verify error', err);
            return done(err as Error, undefined);
          }
        }
      )
    );

    passportInstance = passport;
    return passport;
  } catch (err) {
    logger.warn('passport or passport-google-oauth20 not available; Google OAuth disabled', err);
    return null;
  }
}
