/**
 * Enrich curated recipes that have no health_benefits/health_concerns by calling AI.
 * Used by admin endpoint POST /api/admin/enrich-curated-health.
 */
import { query } from './database';
import { RecipeAIService } from './recipeAIService';
import type { RecipeForHealth } from './prompts';
import { logger } from './logger';

const DEFAULT_LIMIT = 30;

export async function runEnrichCuratedHealth(limit: number = DEFAULT_LIMIT): Promise<{ enriched: number; failed: number }> {
  const result = await query(
    `SELECT id, title, ingredients, instructions, nutritional_info
     FROM recipes
     WHERE user_id IS NULL
       AND (health_benefits IS NULL OR health_benefits = '[]'::jsonb)
     ORDER BY id
     LIMIT $1`,
    [limit]
  );
  const rows = result.rows;
  if (rows.length === 0) {
    logger.info('Enrich curated health: no recipes to enrich');
    return { enriched: 0, failed: 0 };
  }

  const ai = new RecipeAIService();
  let enriched = 0;
  let failed = 0;

  for (const row of rows) {
    const id = row.id;
    const title = String(row.title ?? '');
    const ingredients = Array.isArray(row.ingredients) ? row.ingredients : (typeof row.ingredients === 'string' ? JSON.parse(row.ingredients || '[]') : []);
    const instructions = Array.isArray(row.instructions) ? row.instructions : (typeof row.instructions === 'string' ? JSON.parse(row.instructions || '[]') : []);
    const nutritionalInfo = row.nutritional_info && typeof row.nutritional_info === 'object' ? row.nutritional_info : (typeof row.nutritional_info === 'string' ? JSON.parse(row.nutritional_info || '{}') : {});

    const recipeForHealth: RecipeForHealth = {
      title,
      ingredients: ingredients.map((i: { name?: string; amount?: number; unit?: string }) => ({
        name: i.name ?? '',
        amount: i.amount,
        unit: i.unit,
      })),
      instructions: instructions.map((s: { step?: number; instruction?: string }) => ({
        step: s.step,
        instruction: typeof s === 'string' ? s : (s.instruction ?? ''),
      })),
      nutritionalInfo,
    };

    try {
      const { healthBenefits, healthConcerns } = await ai.generateHealthForRecipe(recipeForHealth);
      await query(
        `UPDATE recipes SET health_benefits = $1, health_concerns = $2, updated_at = NOW() WHERE id = $3`,
        [JSON.stringify(healthBenefits), JSON.stringify(healthConcerns), id]
      );
      enriched++;
      if (enriched % 10 === 0) logger.info('Enrich curated health: progress', { enriched, total: rows.length });
    } catch (err) {
      failed++;
      logger.warn('Enrich curated health: failed for recipe', { id, title, err });
    }
  }

  logger.info('Enrich curated health done', { enriched, failed });
  return { enriched, failed };
}
