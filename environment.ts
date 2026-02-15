import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  
  // Database
  DATABASE_URL: z.string(),
  // Redis: use REDIS_URL, or build from REDIS_* (e.g. Redis Cloud)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SSL: z.string().optional(),
  REDIS_DB: z.string().optional(),
  
  // API Keys (at least one of ANTHROPIC or GEMINI required for recipe/meal-plan generation)
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  USDA_API_KEY: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.string().default('7d'),
  
  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // App
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Google OAuth (optional; if set, Google sign-in is enabled)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  // Per-user daily AI usage cap (recipe + meal-plan generation)
  AI_DAILY_LIMIT_PER_USER: z.string().transform(Number).default('15'),
});

const env = envSchema.parse(process.env);

function getRedisUrl(): string {
  if (env.REDIS_URL) return env.REDIS_URL;
  if (env.REDIS_HOST) {
    const protocol = env.REDIS_SSL === 'true' ? 'rediss' : 'redis';
    const auth = env.REDIS_PASSWORD ? `default:${encodeURIComponent(env.REDIS_PASSWORD)}@` : '';
    const port = env.REDIS_PORT ?? '6379';
    const db = env.REDIS_DB ? `/${env.REDIS_DB}` : '';
    return `${protocol}://${auth}${env.REDIS_HOST}:${port}${db}`;
  }
  return 'redis://localhost:6379';
}

if (!env.ANTHROPIC_API_KEY && !env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY is set. Recipe and meal-plan generation will fail until one is set in .env');
}

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  
  // Database
  databaseUrl: env.DATABASE_URL,
  redisUrl: getRedisUrl(),
  
  // API Keys
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  usdaApiKey: env.USDA_API_KEY,
  
  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpiry: env.JWT_EXPIRY,
  
  // AWS
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET,
    region: env.AWS_REGION,
  },
  
  // App
  frontendUrl: env.FRONTEND_URL,

  // Google OAuth
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  // Per-user daily AI cap
  aiDailyLimitPerUser: env.AI_DAILY_LIMIT_PER_USER,
} as const;
