import { Response } from 'express';
import { AuthRequest } from './auth';
import { RecipeAIService } from './recipeAIService';
import { invalidateMealPlan } from './cacheInvalidation';
import { query } from './database';
import { cache } from './redis';
import { AppError, asyncHandler } from './errorHandler';
import { logger } from './logger';
import { UserPreferences, MealPlanGoals } from './recipe';
import { sendCreated, sendSuccess } from './responseHelper';
import { z } from 'zod';

const MEAL_PLAN_TTL = 3600;

const recipeAIService = new RecipeAIService();

const generateSchema = z.object({
  days: z.number().min(1).max(14).default(7),
  preferences: z.object({
    dietary: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    calorieTarget: z.number().optional(),
  }).optional(),
  goals: z.object({
    calorieTarget: z.number().optional(),
    mealsPerDay: z.number().optional(),
    includeSnacks: z.boolean().optional(),
    budget: z.enum(['low', 'moderate', 'high']).optional(),
    goals: z.string().optional(),
    mealPrepFriendly: z.boolean().optional(),
  }).optional(),
});

function buildShoppingListFromMeals(planDays: any[]): Array<{ ingredient: string; amount: number; unit: string; checked: boolean }> {
  const map = new Map<string, { amount: number; unit: string }>();
  for (const day of planDays) {
    const meals = day.meals ? Object.values(day.meals) : [];
    for (const meal of meals) {
      if (Array.isArray(meal)) {
        meal.forEach((m: any) => addMealIngredients(m, map));
      } else if (meal && (meal as any).ingredients) {
        addMealIngredients(meal as any, map);
      }
    }
  }
  return Array.from(map.entries()).map(([ingredient, { amount, unit }]) => ({
    ingredient,
    amount,
    unit,
    checked: false,
  }));
}

function addMealIngredients(meal: any, map: Map<string, { amount: number; unit: string }>) {
  const ingredients = meal.ingredients || [];
  for (const ing of ingredients) {
    const name = (typeof ing === 'string' ? ing : (ing.name || ing.ingredient || '')).trim().toLowerCase();
    if (!name) continue;
    const amount = Number(ing.amount) || 1;
    const unit = (ing.unit || '').trim();
    const key = `${name}|${unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      map.set(key, { amount, unit });
    }
  }
}

class MealPlanController {
  generate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const body = generateSchema.parse(req.body);
    const days = body.days;
    const preferences: UserPreferences = body.preferences || {};
    const goals: MealPlanGoals = body.goals || {};

    logger.info('Generating meal plan', { userId, days });

    const planDays = await recipeAIService.generateMealPlan(days, preferences, goals);
    const daysArray = Array.isArray(planDays) ? planDays : [planDays];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    const shoppingList = buildShoppingListFromMeals(daysArray);

    const result = await query(
      `INSERT INTO meal_plans (user_id, name, start_date, end_date, meals, shopping_list)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        `${days}-Day Meal Plan`,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        JSON.stringify(daysArray),
        JSON.stringify(shoppingList),
      ]
    );

    const row = result.rows[0] as Record<string, unknown>;
    const plan = this.formatMealPlan(row);
    await invalidateMealPlan(plan.id as string, userId);
    sendCreated(res, plan);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const cacheKey = `meal-plans:user:${userId}`;
    const cached = await cache.get<ReturnType<MealPlanController['formatMealPlan']>[]>(cacheKey);
    if (cached) {
      return sendSuccess(res, cached);
    }
    const result = await query(
      'SELECT * FROM meal_plans WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    const plans = result.rows.map((row: Record<string, unknown>) => this.formatMealPlan(row));
    await cache.set(cacheKey, plans, MEAL_PLAN_TTL);
    return sendSuccess(res, plans);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const cacheKey = `meal-plan:${id}`;
    const cached = await cache.get<ReturnType<MealPlanController['formatMealPlan']>>(cacheKey);
    if (cached) {
      return sendSuccess(res, cached);
    }
    const result = await query('SELECT * FROM meal_plans WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Meal plan not found', 404);
    }
    const plan = this.formatMealPlan(result.rows[0] as Record<string, unknown>);
    await cache.set(cacheKey, plan, MEAL_PLAN_TTL);
    return sendSuccess(res, plan);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, start_date, end_date, meals, shopping_list } = req.body;

    const result = await query(
      `UPDATE meal_plans SET
        name = COALESCE($2, name),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        meals = COALESCE($5, meals),
        shopping_list = COALESCE($6, shopping_list)
       WHERE id = $1 AND user_id = $7
       RETURNING *`,
      [id, name || null, start_date || null, end_date || null, meals ? JSON.stringify(meals) : null, shopping_list ? JSON.stringify(shopping_list) : null, userId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Meal plan not found', 404);
    }
    await invalidateMealPlan(id, userId);
    const plan = this.formatMealPlan(result.rows[0] as Record<string, unknown>);
    sendSuccess(res, plan);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await query('DELETE FROM meal_plans WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Meal plan not found', 404);
    }
    await invalidateMealPlan(id, userId);
    sendSuccess(res, null, 'Meal plan deleted');
  });

  getShoppingList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await query('SELECT shopping_list FROM meal_plans WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Meal plan not found', 404);
    }
    const row = result.rows[0] as Record<string, unknown>;
    const shoppingList = row.shopping_list || [];
    sendSuccess(res, shoppingList);
  });

  private formatMealPlan(row: Record<string, unknown>) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      meals: row.meals,
      shoppingList: row.shopping_list,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const mealPlanController = new MealPlanController();
