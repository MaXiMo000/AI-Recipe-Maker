import { Response } from 'express';
import { AuthRequest } from './auth';
import { query } from './database';
import { cache } from './redis';
import { AppError, asyncHandler } from './errorHandler';
import { sendSuccess } from './responseHelper';
import { z } from 'zod';

const NUTRITION_DAILY_TTL = 3600;

const analyzeSchema = z.object({
  recipeId: z.string().uuid().optional(),
  recipe: z.object({
    ingredients: z.array(z.any()).optional(),
    nutritionalInfo: z.record(z.any()).optional(),
  }).optional(),
}).refine(data => data.recipeId != null || data.recipe != null, {
  message: 'Provide either recipeId or recipe payload',
});

const calculateSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number().default(1),
    unit: z.string().default(''),
  })),
});

function emptyNutrition() {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };
}

function sumNutrition(a: Record<string, number>, b: Record<string, number>) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const out: Record<string, number> = {};
  for (const k of keys) {
    out[k] = (Number((a as any)?.[k]) || 0) + (Number((b as any)?.[k]) || 0);
  }
  return out;
}

class NutritionController {
  analyze = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = analyzeSchema.parse(req.body);
    const userId = req.user!.id;

    if (body.recipeId) {
      const result = await query(
        'SELECT nutritional_info FROM recipes WHERE id = $1 AND (user_id = $2 OR is_public = true)',
        [body.recipeId, userId]
      );
      if (result.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }
      const row = result.rows[0] as { nutritional_info: Record<string, unknown> | null };
      const nutritionalInfo = row.nutritional_info || emptyNutrition();
      return sendSuccess(res, { nutritionalInfo });
    }

    if (body.recipe?.nutritionalInfo) {
      return sendSuccess(res, { nutritionalInfo: body.recipe.nutritionalInfo });
    }

    // Inline recipe without nutritionalInfo: return placeholder (MVP no external API)
    return sendSuccess(res, { nutritionalInfo: emptyNutrition() });
  });

  dailySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const userId = req.user!.id;
    const cacheKey = `nutrition:daily:${userId}:${date}`;
    const cached = await cache.get<{ date: string; summary: Record<string, number>; source: string }>(cacheKey);
    if (cached) {
      return sendSuccess(res, cached);
    }

    const dateNorm = date.slice(0, 10);
    const planResult = await query(
      `SELECT meals, start_date FROM meal_plans
       WHERE user_id = $1 AND start_date <= $2::date AND end_date >= $2::date`,
      [userId, dateNorm]
    );

    let total: Record<string, number> = emptyNutrition();
    for (const row of planResult.rows as { meals: any[]; start_date: string | Date }[]) {
      const days = Array.isArray(row.meals) ? row.meals : [];
      const startDateRaw = row.start_date;
      const startDateStr = typeof startDateRaw === 'string' ? startDateRaw : (startDateRaw instanceof Date ? startDateRaw.toISOString().slice(0, 10) : '');
      const startTime = new Date(startDateStr + 'T00:00:00').getTime();
      const requestTime = new Date(dateNorm + 'T00:00:00').getTime();
      const dayIndex = Math.round((requestTime - startTime) / (24 * 60 * 60 * 1000));
      const day = dayIndex >= 0 && dayIndex < days.length ? days[dayIndex] : days.find((d: any) => {
        const dStr = d.date != null ? String(d.date).slice(0, 10) : '';
        return dStr === dateNorm;
      });
      if (!day?.meals) continue;
      for (const slot of Object.values(day.meals)) {
        const meal = Array.isArray(slot) ? slot : [slot];
        for (const m of meal) {
          if (m?.nutritionalInfo) {
            total = sumNutrition(total, m.nutritionalInfo as Record<string, number>) as Record<string, number>;
          }
        }
      }
      if (day.dailyNutrition) {
        total = sumNutrition(total, day.dailyNutrition as Record<string, number>) as Record<string, number>;
      }
    }

    const payload = { date, summary: total, source: planResult.rows.length > 0 ? 'meal_plan' : 'none' as const };
    await cache.set(cacheKey, payload, NUTRITION_DAILY_TTL);
    return sendSuccess(res, payload);
  });

  calculate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = calculateSchema.parse(req.body);
    // MVP: simple estimated nutrition per ingredient (no external API)
    let total = emptyNutrition();
    for (const ing of body.ingredients) {
      const qty = ing.amount || 1;
      total.calories += 50 * qty;
      total.protein += 2 * qty;
      total.carbs += 5 * qty;
      total.fat += 1 * qty;
      total.fiber += 0.5 * qty;
      total.sugar += 1 * qty;
      total.sodium += 20 * qty;
    }
    sendSuccess(res, { nutritionalInfo: total });
  });
}

export const nutritionController = new NutritionController();
