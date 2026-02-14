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

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/recipes', recipeRoutes);
    this.app.use('/api/meal-plans', mealPlanRoutes);
    this.app.use('/api/nutrition', nutritionRoutes);
    this.app.use('/api/search', searchRoutes);

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
      await connectRedis();

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        logger.info(`🚀 Server running on port ${port}`);
        logger.info(`📝 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start application
const application = new App();
application.start();

export default application.app;
