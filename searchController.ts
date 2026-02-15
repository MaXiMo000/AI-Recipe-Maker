import { createHash } from 'crypto';
import { Response } from 'express';
import { Request } from 'express';
import { AuthRequest } from './auth';
import { query } from './database';
import { asyncHandler } from './errorHandler';
import { cache } from './redis';
import { sendPaginated, sendSuccess } from './responseHelper';

const LIMIT = 20;
const DEFAULT_PAGE = 1;
const SEARCH_CACHE_TTL = 3600;

function hashSearchParams(params: Record<string, unknown>): string {
  const str = JSON.stringify(params);
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function formatRecipeRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    isCurated: row.user_id == null,
    healthBenefits: row.health_benefits ?? [],
    healthConcerns: row.health_concerns ?? [],
    title: row.title,
    description: row.description,
    cuisineType: row.cuisine_type,
    mealType: row.meal_type,
    difficulty: row.difficulty,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    ingredients: row.ingredients,
    instructions: row.instructions,
    nutritionalInfo: row.nutritional_info,
    tags: row.tags,
    imageUrl: row.image_url,
    source: row.source,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatRecipeDbRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    cuisineType: row.cuisine_type,
    tags: row.tags,
    ingredients: row.ingredients,
    instructions: row.instructions,
    nutritionalInfo: row.nutritional_info,
    source: row.source,
  };
}

class SearchController {
  searchRecipes = asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const cuisineType = req.query.cuisineType as string | undefined;
    const mealType = req.query.mealType as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const maxTime = req.query.maxTime != null ? Number(req.query.maxTime) : undefined;
    const page = Math.max(1, Number(req.query.page) || DEFAULT_PAGE);
    const limit = Math.min(50, Number(req.query.limit) || LIMIT);
    const offset = (page - 1) * limit;

    const userId = (req as AuthRequest).user?.id;
    const cacheKey = `search:recipes:${hashSearchParams({ q, cuisineType, mealType, difficulty, maxTime, page, limit, userId: userId ?? null })}`;
    const cached = await cache.get<{ data: unknown[]; total: number }>(cacheKey);
    if (cached) {
      return sendPaginated(res, cached.data, { page, limit, total: cached.total, totalPages: Math.ceil(cached.total / limit) });
    }
    const conditions: string[] = userId
      ? ['(r.is_public = true OR r.user_id = $1 OR r.user_id IS NULL)']
      : ['(r.is_public = true OR r.user_id IS NULL)'];
    const params: (string | number)[] = userId ? [userId] : [];
    let paramIndex = params.length + 1;

    if (q.trim()) {
      conditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }
    if (cuisineType) {
      conditions.push(`r.cuisine_type ILIKE $${paramIndex}`);
      params.push(cuisineType);
      paramIndex++;
    }
    if (mealType) {
      conditions.push(`r.meal_type ILIKE $${paramIndex}`);
      params.push(mealType);
      paramIndex++;
    }
    if (difficulty) {
      conditions.push(`r.difficulty ILIKE $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }
    if (maxTime != null && !isNaN(maxTime)) {
      conditions.push(`(COALESCE(r.prep_time,0) + COALESCE(r.cook_time,0)) <= $${paramIndex}`);
      params.push(maxTime);
      paramIndex++;
    }

    const where = conditions.join(' AND ');
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM recipes r WHERE ${where}`,
      params
    );
    const total = Number(countResult.rows[0]?.total) || 0;

    const result = await query(
      `SELECT * FROM recipes r WHERE ${where} ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const data = result.rows.map((row: Record<string, unknown>) => formatRecipeRow(row));
    await cache.set(cacheKey, { data, total }, SEARCH_CACHE_TTL);
    return sendPaginated(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  });

  searchIngredients = asyncHandler(async (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    const limit = Math.min(50, Number(req.query.limit) || 20);

    const result = await query(
      `SELECT ingredients FROM recipes WHERE ingredients IS NOT NULL
       UNION ALL
       SELECT ingredients FROM recipe_database WHERE ingredients IS NOT NULL`,
      []
    );
    const nameSet = new Set<string>();
    for (const row of result.rows as { ingredients: any[] }[]) {
      const ing = row.ingredients;
      if (Array.isArray(ing)) {
        ing.forEach((i: any) => {
          const n = i?.name ?? i?.ingredient ?? (typeof i === 'string' ? i : '');
          if (n) nameSet.add(String(n).trim());
        });
      }
    }
    let names = Array.from(nameSet);
    if (q) {
      names = names.filter(n => n.toLowerCase().includes(q));
    }
    names = [...new Set(names)].slice(0, limit).sort();

    sendSuccess(res, names);
  });

  similar = asyncHandler(async (req: Request, res: Response) => {
    const recipeId = req.query.recipeId as string | undefined;
    const ingredientsParam = req.query.ingredients;
    let ingredients: string[] = [];

    if (recipeId) {
      const r = await query('SELECT ingredients FROM recipes WHERE id = $1', [recipeId]);
      if (r.rows.length === 0) {
        const rdb = await query('SELECT ingredients FROM recipe_database WHERE id = $1', [recipeId]);
        if (rdb.rows.length === 0) {
          return sendSuccess(res, [], 'Recipe not found');
        }
        const ing = (rdb.rows[0] as { ingredients: any[] }).ingredients;
        ingredients = (ing || []).map((i: any) => (i.name || i.ingredient || String(i)).toLowerCase()).filter(Boolean);
      } else {
        const ing = (r.rows[0] as { ingredients: any[] }).ingredients;
        ingredients = (ing || []).map((i: any) => (i.name || i.ingredient || String(i)).toLowerCase()).filter(Boolean);
      }
    } else if (ingredientsParam) {
      ingredients = (Array.isArray(ingredientsParam) ? ingredientsParam : [ingredientsParam])
        .map(s => String(s).toLowerCase().trim())
        .filter(Boolean);
    }

    if (ingredients.length === 0) {
      return sendSuccess(res, []);
    }

    const result = await query(
      `SELECT * FROM recipe_database r
       WHERE EXISTS (
         SELECT 1 FROM jsonb_array_elements(r.ingredients) AS elem
         WHERE lower(COALESCE(elem->>'name', elem->>'ingredient', elem::text)) = ANY($1::text[])
       )
       ORDER BY popularity_score DESC
       LIMIT 10`,
      [ingredients]
    );

    const data = result.rows.map((row: Record<string, unknown>) => formatRecipeDbRow(row));
    return sendSuccess(res, data);
  });
}

export const searchController = new SearchController();
