import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from './database';
import { AuthRequest, generateToken } from './auth';
import { invalidateNutritionDaily } from './cacheInvalidation';
import { AppError, asyncHandler } from './errorHandler';
import { logger } from './logger';
import { sendCreated, sendSuccess } from './responseHelper';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  calorieTarget: z.number().optional(),
});

class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [email, passwordHash, fullName || null]
    );

    const user = result.rows[0] as {
      id: string;
      email: string;
      full_name: string | null;
      created_at: Date;
    };

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info('New user registered', { userId: user.id, email: user.email });

    sendCreated(res, {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
      token,
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    // Get user
    const result = await query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0] as {
      id: string;
      email: string;
      password_hash: string | null;
      full_name: string | null;
    };

    if (!user.password_hash) {
      throw new AppError('This account uses Google sign-in. Please sign in with Google.', 401);
    }

    // Verify password
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Set cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      token,
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.clearCookie('accessToken');
    sendSuccess(res, null, 'Logged out successfully');
  });

  /**
   * Get current user
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await query(
      `SELECT id, email, full_name, dietary_preferences, allergies, 
              skill_level, calorie_target, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      dietaryPreferences: user.dietary_preferences,
      allergies: user.allergies,
      skillLevel: user.skill_level,
      calorieTarget: user.calorie_target,
      createdAt: user.created_at,
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const updates = updateProfileSchema.parse(req.body);

    const result = await query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        dietary_preferences = COALESCE($2, dietary_preferences),
        allergies = COALESCE($3, allergies),
        skill_level = COALESCE($4, skill_level),
        calorie_target = COALESCE($5, calorie_target),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, full_name, dietary_preferences, allergies, skill_level, calorie_target`,
      [
        updates.fullName,
        updates.dietaryPreferences ? JSON.stringify(updates.dietaryPreferences) : null,
        updates.allergies ? JSON.stringify(updates.allergies) : null,
        updates.skillLevel,
        updates.calorieTarget,
        userId,
      ]
    );

    logger.info('User profile updated', { userId });
    await invalidateNutritionDaily(userId);

    sendSuccess(res, {
      id: result.rows[0].id,
      email: result.rows[0].email,
      fullName: result.rows[0].full_name,
      dietaryPreferences: result.rows[0].dietary_preferences,
      allergies: result.rows[0].allergies,
      skillLevel: result.rows[0].skill_level,
      calorieTarget: result.rows[0].calorie_target,
    });
  });
}

export const authController = new AuthController();
