import { Response } from 'express';
import { AuthRequest } from './auth';
import { query } from './database';
import { asyncHandler } from './errorHandler';
import { AppError } from './errorHandler';
import { sendSuccess, sendCreated } from './responseHelper';

function formatRecipeRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    userId: row.user_id,
    isCurated: row.user_id == null,
    title: row.title,
    description: row.description ?? '',
    cuisineType: row.cuisine_type,
    mealType: row.meal_type,
    difficulty: row.difficulty ?? 'medium',
    prepTime: row.prep_time ?? 0,
    cookTime: row.cook_time ?? 0,
    servings: row.servings ?? 4,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    nutritionalInfo: row.nutritional_info,
    tags: row.tags ?? [],
    imageUrl: row.image_url,
    healthBenefits: row.health_benefits ?? [],
    healthConcerns: row.health_concerns ?? [],
    source: row.source ?? (row.user_id == null ? 'curated' : 'user_created'),
    isPublic: Boolean(row.is_public),
    isFavorite: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatCollection(row: Record<string, unknown>) {
  const recipeIds = Array.isArray(row.recipe_ids) ? row.recipe_ids : (typeof row.recipe_ids === 'string' ? JSON.parse(row.recipe_ids || '[]') : []);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    recipeIds,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
  };
}

class CollectionController {
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await query(
      'SELECT id, name, description, recipe_ids, is_public, created_at FROM recipe_collections WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const collections = result.rows.map((row: Record<string, unknown>) => formatCollection(row));
    return sendSuccess(res, collections);
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name is required', 400);
    }
    const result = await query(
      `INSERT INTO recipe_collections (user_id, name, description) VALUES ($1, $2, $3) RETURNING id, name, description, recipe_ids, is_public, created_at`,
      [userId, name.trim(), (description && typeof description === 'string') ? description.trim() : null]
    );
    return sendCreated(res, formatCollection(result.rows[0]));
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, description, recipe_ids, is_public, created_at FROM recipe_collections WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Collection not found', 404);
    }
    const row = result.rows[0] as Record<string, unknown>;
    const recipeIds = Array.isArray(row.recipe_ids) ? row.recipe_ids as string[] : (typeof row.recipe_ids === 'string' ? JSON.parse(row.recipe_ids || '[]') : []);
    const collection = formatCollection(row);

    if (recipeIds.length === 0) {
      return sendSuccess(res, { ...collection, recipes: [] });
    }

    const recipesResult = await query(
      `SELECT * FROM recipes WHERE id = ANY($1::uuid[]) AND (user_id = $2 OR user_id IS NULL OR is_public = true) ORDER BY created_at DESC`,
      [recipeIds, userId]
    );
    const recipes = recipesResult.rows.map((r: Record<string, unknown>) => formatRecipeRow(r));
    return sendSuccess(res, { ...collection, recipes });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, recipeIds } = req.body;

    const check = await query('SELECT id FROM recipe_collections WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) throw new AppError('Collection not found', 404);

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (name !== undefined && typeof name === 'string') {
      updates.push(`name = $${idx++}`);
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      params.push(typeof description === 'string' ? description.trim() : null);
    }
    if (recipeIds !== undefined && Array.isArray(recipeIds)) {
      updates.push(`recipe_ids = $${idx++}`);
      params.push(JSON.stringify(recipeIds));
    }
    if (updates.length === 0) {
      const result = await query('SELECT id, name, description, recipe_ids, is_public, created_at FROM recipe_collections WHERE id = $1', [id]);
      return sendSuccess(res, formatCollection(result.rows[0]));
    }
    params.push(id);
    const result = await query(
      `UPDATE recipe_collections SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, description, recipe_ids, is_public, created_at`,
      params
    );
    return sendSuccess(res, formatCollection(result.rows[0]));
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await query('DELETE FROM recipe_collections WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) throw new AppError('Collection not found', 404);
    return sendSuccess(res, null, 'Collection deleted');
  });
}

export const collectionController = new CollectionController();
