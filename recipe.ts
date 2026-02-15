// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  dietaryPreferences: string[];
  allergies: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  calorieTarget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  dietary?: string[];
  allergies?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  cuisine?: string;
  mealType?: string;
  maxCookTime?: number;
  calorieTarget?: number;
  mealsPerDay?: number;
  favoriteCuisines?: string[];
}

// Recipe types
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Instruction {
  step: number;
  instruction: string;
  time?: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: {
    vitaminA?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
  };
}

export interface Recipe {
  id?: string;
  userId?: string;
  /** True for app-curated recipes (visible to all, not editable/deletable by users) */
  isCurated?: boolean;
  title: string;
  description: string;
  cuisineType?: string;
  mealType?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutritionalInfo?: NutritionalInfo;
  tags: string[];
  imageUrl?: string;
  source: 'ai_generated' | 'user_created' | 'imported' | 'curated';
  isPublic: boolean;
  /** Short health benefits (e.g. "Good for eyes (vitamin A)", "Heart-friendly") */
  healthBenefits?: string[];
  /** Short health concerns or cautions (e.g. "High sodium – limit if watching blood pressure", "Processed – enjoy in moderation") */
  healthConcerns?: string[];
  /** True when the current user has added this recipe to favorites */
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeModifications {
  servings?: number;
  dietary?: string[];
  substitutions?: Record<string, string>;
  reduceTime?: boolean;
  simplify?: boolean;
  makeHealthier?: boolean;
}

// Meal Plan types
export interface MealPlanMeal {
  recipe: Recipe;
  scheduledTime?: string;
}

export interface MealPlanDay {
  day: number;
  date: string;
  meals: {
    breakfast?: MealPlanMeal;
    lunch?: MealPlanMeal;
    dinner?: MealPlanMeal;
    snacks?: MealPlanMeal[];
  };
  dailyNutrition?: NutritionalInfo;
  notes?: string;
}

export interface ShoppingListItem {
  ingredient: string;
  amount: number;
  unit: string;
  checked: boolean;
  category?: string;
}

export interface MealPlan {
  id?: string;
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  days: MealPlanDay[];
  shoppingList?: ShoppingListItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MealPlanGoals {
  calorieTarget?: number;
  mealsPerDay?: number;
  includeSnacks?: boolean;
  budget?: 'low' | 'moderate' | 'high';
  goals?: string;
  mealPrepFriendly?: boolean;
}

// Collection types
export interface RecipeCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  recipeIds: string[];
  isPublic: boolean;
  createdAt: Date;
}

// Search types
export interface RecipeSearchFilters {
  query?: string;
  cuisineType?: string;
  mealType?: string;
  difficulty?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
  dietary?: string[];
  ingredients?: string[];
  tags?: string[];
  minRating?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName?: string;
}
