import { Pool, QueryResult } from 'pg';
import { config } from './environment';
import { logger } from './logger';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20, // maximum number of clients
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    logger.info('✅ PostgreSQL connected successfully');
    client.release();

    // Handle pool errors
    pool.on('error', (err: Error) => {
      logger.error('Unexpected database error:', err);
    });
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error });
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

// Database schema initialization
export const initializeSchema = async (): Promise<void> => {
  const schema = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      full_name VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      dietary_preferences JSONB DEFAULT '[]',
      allergies JSONB DEFAULT '[]',
      skill_level VARCHAR(50) DEFAULT 'beginner',
      calorie_target INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Recipes table
    CREATE TABLE IF NOT EXISTS recipes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cuisine_type VARCHAR(100),
      meal_type VARCHAR(100),
      difficulty VARCHAR(50),
      prep_time INTEGER,
      cook_time INTEGER,
      servings INTEGER DEFAULT 4,
      ingredients JSONB NOT NULL,
      instructions JSONB NOT NULL,
      nutritional_info JSONB,
      tags JSONB DEFAULT '[]',
      image_url TEXT,
      source VARCHAR(50) DEFAULT 'ai_generated',
      is_public BOOLEAN DEFAULT FALSE,
      health_benefits JSONB DEFAULT '[]',
      health_concerns JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Meal plans table
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      meals JSONB NOT NULL,
      shopping_list JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Recipe collections table
    CREATE TABLE IF NOT EXISTS recipe_collections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      recipe_ids JSONB DEFAULT '[]',
      is_public BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Recipe database (for hybrid AI approach)
    CREATE TABLE IF NOT EXISTS recipe_database (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      ingredients JSONB NOT NULL,
      instructions JSONB NOT NULL,
      nutritional_info JSONB,
      cuisine_type VARCHAR(100),
      tags JSONB DEFAULT '[]',
      source VARCHAR(255),
      popularity_score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- User favorites
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, recipe_id)
    );

    -- Per-user daily AI usage (recipe/meal-plan generation)
    CREATE TABLE IF NOT EXISTS ai_usage_daily (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      usage_date DATE NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, usage_date)
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, usage_date);

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type);
    CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_recipe_db_ingredients ON recipe_database USING GIN(ingredients);
    CREATE INDEX IF NOT EXISTS idx_recipe_db_tags ON recipe_database USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
  `;

  try {
    await query(schema);
    logger.info('✅ Database schema initialized');

    // Idempotent migration: Google OAuth support (for existing DBs created before google_id)
    const migration = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'google_id') THEN
          ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
        END IF;
      END $$;
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `;
    await query(migration);

    // Allow curated recipes: user_id NULL = system/curated (read-only for all users)
    await query(`ALTER TABLE recipes ALTER COLUMN user_id DROP NOT NULL`).catch((err: Error) => {
      if (!String(err.message).includes('already')) logger.warn('recipes.user_id nullable:', err.message);
    });
    // Health pros/cons (for AI-generated and optionally curated)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'health_benefits') THEN
          ALTER TABLE recipes ADD COLUMN health_benefits JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'health_concerns') THEN
          ALTER TABLE recipes ADD COLUMN health_concerns JSONB DEFAULT '[]';
        END IF;
      END $$;
    `).catch((err: Error) => {
      logger.warn('recipes health columns migration:', err.message);
    });
  } catch (error) {
    logger.error('Failed to initialize schema:', error);
    throw error;
  }
};
