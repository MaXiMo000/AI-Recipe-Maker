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

export async function getFavorites(): Promise<RecipeListItem[]> {
  const { data } = await api.get<{ success: boolean; data: RecipeListItem[] }>('/recipes/favorites/list');
  return data.data ?? [];
}

export async function addFavorite(recipeId: string): Promise<void> {
  await api.post(`/recipes/${recipeId}/favorite`);
}

export async function removeFavorite(recipeId: string): Promise<void> {
  await api.delete(`/recipes/${recipeId}/favorite`);
}
