import { api } from './api';

export interface RecipeListItem {
  id: string;
  title: string;
  cuisineType?: string;
  mealType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  isCurated?: boolean;
  isFavorite?: boolean;
  imageUrl?: string;
  tags?: string[];
}

export interface FavoritesResponse {
  success: boolean;
  data: RecipeListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getFavorites(params?: { page?: number; limit?: number }): Promise<FavoritesResponse> {
  const { data } = await api.get<FavoritesResponse>('/recipes/favorites/list', { params });
  return data;
}

export async function addFavorite(recipeId: string): Promise<void> {
  await api.post(`/recipes/${recipeId}/favorite`);
}

export async function removeFavorite(recipeId: string): Promise<void> {
  await api.delete(`/recipes/${recipeId}/favorite`);
}
