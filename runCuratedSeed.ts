/**
 * One-time seed of curated recipes (user_id = NULL). Safe to call on every startup.
 * Skips if curated recipes already exist. Used by app.ts on start and by scripts/seedCuratedRecipes.ts.
 */
import { query } from './database';
import { CURATED_RECIPES } from './scripts/curatedRecipesData';
import { logger } from './logger';

export async function runCuratedSeed(): Promise<void> {
  try {
    const countResult = await query(
      'SELECT COUNT(*) AS n FROM recipes WHERE user_id IS NULL'
    );
    const existing = parseInt(String(countResult.rows[0]?.n ?? 0), 10);
    if (existing > 0) {
      logger.info(`Curated recipes already present (${existing}). Skipping seed.`);
      return;
    }

    for (const r of CURATED_RECIPES) {
      await query(
        `INSERT INTO recipes (
          user_id, title, description, cuisine_type, meal_type, difficulty,
          prep_time, cook_time, servings, ingredients, instructions,
          nutritional_info, tags, source, is_public
        ) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, 'curated', true)`,
        [
          r.title,
          r.description,
          r.cuisine_type,
          r.meal_type,
          r.difficulty,
          r.prep_time,
          r.cook_time,
          r.servings,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.instructions),
          JSON.stringify(r.tags || []),
        ]
      );
      logger.info('Curated recipe inserted: ' + r.title);
    }
    logger.info(`Curated seed complete: ${CURATED_RECIPES.length} recipes.`);
  } catch (err) {
    logger.warn('Curated seed failed (non-fatal):', err);
    throw err;
  }
}
