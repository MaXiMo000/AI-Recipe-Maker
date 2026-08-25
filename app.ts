// Log any crash to stdout/stderr so Docker shows it
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err?.message ?? err);
  console.error(err?.stack ?? err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, _promise) => {
  console.error('[FATAL] unhandledRejection:', reason);
  process.exit(1);
});

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './environment';
import { errorHandler, notFound } from './errorHandler';
import { logger } from './logger';
import { initPassportGoogle } from './passportGoogle';

// Routes
import { globalApiLimiter } from './rateLimiter';
import authRoutes from './authRoutes';
import recipeRoutes from './recipes';
import mealPlanRoutes from './mealPlans';
import nutritionRoutes from './nutrition';
import searchRoutes from './search';
import adminRoutes from './adminRoutes';
import collectionsRoutes from './collections';

// Database
import { connectDatabase, initializeSchema } from './database';
import { connectRedis } from './redis';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Trust first proxy (e.g. Render) so X-Forwarded-For is used for rate limiting and IP detection
    this.app.set('trust proxy', 1);

    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.frontendUrl,
      credentials: true,
    }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    const passport = initPassportGoogle();
    if (passport) {
      this.app.use(passport.initialize());
    }

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Global API rate limit (before mounting routes)
    this.app.use('/api', globalApiLimiter);

    // API responses: revalidate every time so lists update after create/delete (no stale 304)
    // React Query still caches in memory and invalidates on mutation
    this.app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
      res.set('Cache-Control', 'private, max-age=0, must-revalidate');
      next();
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/recipes', recipeRoutes);
    this.app.use('/api/meal-plans', mealPlanRoutes);
    this.app.use('/api/nutrition', nutritionRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/collections', collectionsRoutes);

    // 404 handler
    this.app.use(notFound);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to databases
      await connectDatabase();
      await initializeSchema();
      const { runCuratedSeed } = await import('./runCuratedSeed');
      await runCuratedSeed().catch((err) => logger.warn('Curated seed skipped or failed', err));
      await connectRedis();

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        logger.info(`🚀 Server running on port ${port}`);
        logger.info(`📝 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[FATAL] Failed to start server:', err.message);
      console.error(err.stack ?? err);
      // Deliberately swallowed: if the logger itself is what failed, the
    // original startup error above is the one that matters.
    try { logger.error('Failed to start server:', error); } catch { /* ignore */ }
      process.exit(1);
    }
  }
}

// Start application (wrap so import-time errors are visible if they occur later)
const application = new App();
application.start().catch((err) => {
  console.error('[FATAL] start() rejected:', err?.message ?? err);
  console.error(err?.stack ?? err);
  process.exit(1);
});

export default application.app;
