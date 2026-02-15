import { Response } from 'express';
import { AuthRequest } from './auth';
import { RecipeAIService } from './recipeAIService';
import { query } from './database';
import { invalidateRecipe, invalidateRecipeForUser } from './cacheInvalidation';
import { cache } from './redis';
import { AppError, asyncHandler } from './errorHandler';
import { logger } from './logger';
import { Recipe, UserPreferences, RecipeModifications } from './recipe';
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from './responseHelper';
import { z } from 'zod';

const recipeAIService = new RecipeAIService();

// Validation schemas
const generateRecipeSchema = z.object({
  ingredients: z.array(z.string()).min(1, 'At least one ingredient required'),
  preferences: z.object({
    dietary: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    cuisine: z.string().optional(),
    mealType: z.string().optional(),
    maxCookTime: z.number().optional(),
  }).optional(),
});

const modifyRecipeSchema = z.object({
  modifications: z.object({
    servings: z.number().optional(),
    dietary: z.array(z.string()).optional(),
    substitutions: z.record(z.string()).optional(),
    reduceTime: z.boolean().optional(),
    simplify: z.boolean().optional(),
    makeHealthier: z.boolean().optional(),
  }),
});

class RecipeController {
  /**
   * Generate a new recipe using AI
   */
  generateRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ingredients, preferences } = generateRecipeSchema.parse(req.body);
    const userId = req.user!.id;

    logger.info('Generating recipe', { userId, ingredientCount: ingredients.length });

    // Get user preferences from database if not provided
    let userPrefs: UserPreferences = preferences || {};
    if (!preferences) {
      const userResult = await query(
        'SELECT dietary_preferences, allergies, skill_level FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as {
          dietary_preferences: string[] | null;
          allergies: string[] | null;
          skill_level: string | null;
        };
        userPrefs = {
          dietary: user.dietary_preferences ?? undefined,
          allergies: user.allergies ?? undefined,
          skillLevel: (user.skill_level as UserPreferences['skillLevel']) ?? undefined,
        };
      }
    }

    // Check recipe database for similar recipes (hybrid approach)
    const similarRecipes = await this.findSimilarRecipes(ingredients);
    if (similarRecipes.length > 0) {
      logger.info('Found similar recipes in database', { count: similarRecipes.length });
      // Could use these as context for AI generation
    }

    // Generate recipe with AI
    const recipe = await recipeAIService.generateRecipe(ingredients, userPrefs);

    // Save to database
    const result = await query(
      `INSERT INTO recipes (
        user_id, title, description, cuisine_type, meal_type, difficulty,
        prep_time, cook_time, servings, ingredients, instructions,
        nutritional_info, tags, health_benefits, health_concerns, image_url, source, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        userId,
        recipe.title,
        recipe.description,
        recipe.cuisineType,
        recipe.mealType,
        recipe.difficulty,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.instructions),
        JSON.stringify(recipe.nutritionalInfo),
        JSON.stringify(recipe.tags),
        JSON.stringify(recipe.healthBenefits ?? []),
        JSON.stringify(recipe.healthConcerns ?? []),
        recipe.imageUrl ?? null,
        'ai_generated',
        false,
      ]
    );

    const savedRecipe = this.formatRecipe(result.rows[0]);

    await invalidateRecipeForUser(userId);

    sendCreated(res, savedRecipe);
  });

  /**
   * Modify an existing recipe
   */
  modifyRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { modifications } = modifyRecipeSchema.parse(req.body);
    const userId = req.user!.id;

    // Get original recipe
    const recipeResult = await query(
      'SELECT * FROM recipes WHERE id = $1',
      [id]
    );

    if (recipeResult.rows.length === 0) {
      throw new AppError('Recipe not found', 404);
    }

    const originalRecipe = this.formatRecipe(recipeResult.rows[0]);

    // Generate modified recipe with AI
    const modifiedRecipe = await recipeAIService.modifyRecipe(
      originalRecipe,
      modifications as RecipeModifications
    );

    // Save as new recipe
    const result = await query(
      `INSERT INTO recipes (
        user_id, title, description, cuisine_type, meal_type, difficulty,
        prep_time, cook_time, servings, ingredients, instructions,
        nutritional_info, tags, health_benefits, health_concerns, image_url, source, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        userId,
        modifiedRecipe.title + ' (Modified)',
        modifiedRecipe.description,
        modifiedRecipe.cuisineType,
        modifiedRecipe.mealType,
        modifiedRecipe.difficulty,
        modifiedRecipe.prepTime,
        modifiedRecipe.cookTime,
        modifiedRecipe.servings,
        JSON.stringify(modifiedRecipe.ingredients),
        JSON.stringify(modifiedRecipe.instructions),
        JSON.stringify(modifiedRecipe.nutritionalInfo),
        JSON.stringify(modifiedRecipe.tags),
        JSON.stringify(modifiedRecipe.healthBenefits ?? []),
        JSON.stringify(modifiedRecipe.healthConcerns ?? []),
        modifiedRecipe.imageUrl ?? null,
        'ai_generated',
        false,
      ]
    );

    sendSuccess(res, this.formatRecipe(result.rows[0]));
  });

  /**
   * Get recipe suggestions based on pantry
   */
  getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pantryItems } = req.body;
    const userId = req.user!.id;

    if (!pantryItems || !Array.isArray(pantryItems) || pantryItems.length === 0) {
      throw new AppError('Pantry items required', 400);
    }

    // Get user preferences
    const userResult = await query(
      'SELECT dietary_preferences, allergies, skill_level FROM users WHERE id = $1',
      [userId]
    );

    const userPrefs: UserPreferences = userResult.rows.length > 0
      ? (() => {
          const user = userResult.rows[0] as {
            dietary_preferences: string[] | null;
            allergies: string[] | null;
            skill_level: string | null;
          };
          return {
            dietary: user.dietary_preferences ?? undefined,
            allergies: user.allergies ?? undefined,
            skillLevel: (user.skill_level as UserPreferences['skillLevel']) ?? undefined,
          };
        })()
      : {};

    const suggestions = await recipeAIService.suggestRecipes(pantryItems, userPrefs);

    sendSuccess(res, suggestions);
  });

  /**
   * Get all recipes with filters
   */
  getRecipes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      cuisineType,
      mealType,
      difficulty,
      tags: _tags,
      userId: filterUserId,
      sort: sortParam,
      order: orderParam,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Allowed sort/order (whitelist to avoid SQL injection)
    const sortAllowed = ['createdAt', 'title', 'totalTime'] as const;
    const orderAllowed = ['asc', 'desc'] as const;
    const sort = sortAllowed.includes(String(sortParam) as typeof sortAllowed[number]) ? String(sortParam) : 'createdAt';
    const order = orderAllowed.includes(String(orderParam) as typeof orderAllowed[number]) ? String(orderParam) : 'desc';

    // Build WHERE conditions
    if (cuisineType) {
      whereConditions.push(`cuisine_type = $${paramIndex++}`);
      params.push(cuisineType);
    }
    if (mealType) {
      whereConditions.push(`meal_type = $${paramIndex++}`);
      params.push(mealType);
    }
    if (difficulty) {
      whereConditions.push(`difficulty = $${paramIndex++}`);
      params.push(difficulty);
    }
    if (filterUserId) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      params.push(filterUserId);
    } else if (req.user) {
      // Logged in, no filter: show user's recipes + curated (user_id IS NULL)
      whereConditions.push(`(user_id = $${paramIndex++} OR user_id IS NULL)`);
      params.push(req.user.id);
    } else {
      // Not logged in: public recipes + curated
      whereConditions.push('(is_public = true OR user_id IS NULL)');
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Sort column expression (safe: whitelisted)
    const sortColumn =
      sort === 'title'
        ? 'title'
        : sort === 'totalTime'
          ? '(COALESCE(prep_time,0) + COALESCE(cook_time,0))'
          : 'created_at';
    const orderDir = order.toUpperCase() as 'ASC' | 'DESC';

    // Order: user's recipes first when applicable, then chosen sort
    const orderClause = req.user && !filterUserId
      ? `ORDER BY (user_id IS NOT NULL AND user_id = $${params.length + 1}) DESC, ${sortColumn} ${orderDir}`
      : `ORDER BY ${sortColumn} ${orderDir}`;
    const orderParams = req.user && !filterUserId ? [...params, req.user.id] : params;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM recipes ${whereClause}`,
      params
    );
    const total = parseInt(String(countResult.rows[0].count), 10);

    // Get recipes (orderParams may add one param for ORDER BY when showing my + curated)
    const selectParams = orderParams;
    const limitIndex = selectParams.length + 1;
    const offsetIndex = selectParams.length + 2;
    const result = await query(
      `SELECT * FROM recipes ${whereClause}
       ${orderClause}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...selectParams, limit, offset]
    );

    let favoriteIds = new Set<string>();
    if (req.user) {
      const favResult = await query('SELECT recipe_id FROM user_favorites WHERE user_id = $1', [req.user.id]);
      favoriteIds = new Set((favResult.rows as { recipe_id: string }[]).map((r) => r.recipe_id));
    }
    const recipes = result.rows.map((row: Record<string, unknown>) =>
      this.formatRecipe(row, req.user ? favoriteIds.has(String(row.id)) : false)
    );

    sendPaginated(res, recipes, {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    });
  });

  /**
   * Get single recipe by ID
   */
  getRecipeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check cache first (skip cache if user is logged in so we can add isFavorite)
    const cached = req.user ? null : await cache.get<Recipe>(`recipe:${id}`);
    if (cached) {
      return sendSuccess(res, cached);
    }

    const result = await query('SELECT * FROM recipes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Recipe not found', 404);
    }

    let isFavorite = false;
    if (req.user) {
      const favResult = await query(
        'SELECT 1 FROM user_favorites WHERE user_id = $1 AND recipe_id = $2',
        [req.user.id, id]
      );
      isFavorite = favResult.rows.length > 0;
    }
    const recipe = this.formatRecipe(result.rows[0], isFavorite);

    if (!req.user) {
      await cache.set(`recipe:${id}`, recipe, 3600);
    }

    return sendSuccess(res, recipe);
  });

  /**
   * Create custom recipe (user-created)
   */
  createRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const recipeData = req.body;

    const result = await query(
      `INSERT INTO recipes (
        user_id, title, description, cuisine_type, meal_type, difficulty,
        prep_time, cook_time, servings, ingredients, instructions,
        nutritional_info, tags, health_benefits, health_concerns, source, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId,
        recipeData.title,
        recipeData.description,
        recipeData.cuisineType,
        recipeData.mealType,
        recipeData.difficulty,
        recipeData.prepTime,
        recipeData.cookTime,
        recipeData.servings,
        JSON.stringify(recipeData.ingredients),
        JSON.stringify(recipeData.instructions),
        JSON.stringify(recipeData.nutritionalInfo),
        JSON.stringify(recipeData.tags || []),
        JSON.stringify(recipeData.healthBenefits ?? []),
        JSON.stringify(recipeData.healthConcerns ?? []),
        'user_created',
        recipeData.isPublic || false,
      ]
    );

    await invalidateRecipeForUser(userId);

    sendCreated(res, this.formatRecipe(result.rows[0]));
  });

  /**
   * Update recipe
   */
  updateRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    // Verify ownership
    const checkResult = await query(
      'SELECT user_id FROM recipes WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Recipe not found', 404);
    }
    if (checkResult.rows[0].user_id == null) {
      throw new AppError('Curated recipes cannot be modified', 403);
    }
    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('Not authorized to update this recipe', 403);
    }

    // Update recipe
    const result = await query(
      `UPDATE recipes SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        ingredients = COALESCE($3, ingredients),
        instructions = COALESCE($4, instructions),
        health_benefits = COALESCE($5, health_benefits),
        health_concerns = COALESCE($6, health_concerns),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *`,
      [
        updates.title,
        updates.description,
        updates.ingredients ? JSON.stringify(updates.ingredients) : null,
        updates.instructions ? JSON.stringify(updates.instructions) : null,
        updates.healthBenefits != null ? JSON.stringify(updates.healthBenefits) : null,
        updates.healthConcerns != null ? JSON.stringify(updates.healthConcerns) : null,
        id,
      ]
    );

    await invalidateRecipe(id, userId);

    sendSuccess(res, this.formatRecipe(result.rows[0]));
  });

  /**
   * Delete recipe
   */
  deleteRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const checkResult = await query(
      'SELECT user_id FROM recipes WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Recipe not found', 404);
    }
    if (checkResult.rows[0].user_id == null) {
      throw new AppError('Curated recipes cannot be deleted', 403);
    }
    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('Not authorized to delete this recipe', 403);
    }

    await query('DELETE FROM recipes WHERE id = $1', [id]);
    await invalidateRecipe(id, userId);

    sendSuccess(res, null, 'Recipe deleted successfully');
  });

  /**
   * Add recipe to favorites
   */
  addToFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    await query(
      'INSERT INTO user_favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, id]
    );

    sendSuccess(res, null, 'Added to favorites');
  });

  /**
   * Remove recipe from favorites
   */
  removeFromFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    await query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, id]
    );

    sendSuccess(res, null, 'Removed from favorites');
  });

  /**
   * Get user's favorite recipes (paginated)
   */
  getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_favorites WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(String(countResult.rows[0].count), 10);

    const result = await query(
      `SELECT r.* FROM recipes r
       JOIN user_favorites f ON r.id = f.recipe_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const recipes = result.rows.map((row: Record<string, unknown>) =>
      this.formatRecipe(row, true)
    );

    sendPaginated(res, recipes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  });

  /**
   * Helper: Find similar recipes in database
   */
  private async findSimilarRecipes(ingredients: string[]): Promise<any[]> {
    // Simple implementation - could be enhanced with better matching
    const result = await query(
      `SELECT * FROM recipe_database
       WHERE ingredients ?| $1
       ORDER BY popularity_score DESC
       LIMIT 5`,
      [ingredients]
    );

    return result.rows;
  }

  /**
   * Helper: Format recipe from database row
   */
  private formatRecipe(row: Record<string, unknown>, isFavorite = false): Recipe {
    return {
      id: row.id as string,
      userId: row.user_id as string | undefined,
      isCurated: row.user_id == null,
      title: row.title as string,
      description: (row.description as string) ?? '',
      cuisineType: row.cuisine_type as string | undefined,
      mealType: row.meal_type as string | undefined,
      difficulty: (row.difficulty as Recipe['difficulty']) ?? 'medium',
      prepTime: Number(row.prep_time) ?? 0,
      cookTime: Number(row.cook_time) ?? 0,
      servings: Number(row.servings) ?? 4,
      ingredients: (row.ingredients as Recipe['ingredients']) ?? [],
      instructions: (row.instructions as Recipe['instructions']) ?? [],
      nutritionalInfo: row.nutritional_info as Recipe['nutritionalInfo'],
      tags: (row.tags as string[]) ?? [],
      imageUrl: row.image_url as string | undefined,
      healthBenefits: (row.health_benefits as string[]) ?? [],
      healthConcerns: (row.health_concerns as string[]) ?? [],
      source: (row.source as Recipe['source']) ?? (row.user_id == null ? 'curated' : 'user_created'),
      isPublic: Boolean(row.is_public),
      isFavorite,
      createdAt: row.created_at as Date | undefined,
      updatedAt: row.updated_at as Date | undefined,
    };
  }
}

export const recipeController = new RecipeController();
