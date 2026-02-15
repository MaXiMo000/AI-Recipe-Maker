import { api } from './api';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  isPublic: boolean;
  createdAt?: string;
}

export interface CollectionWithRecipes extends Collection {
  recipes: Array<{
    id: string;
    title: string;
    cuisineType?: string;
    mealType?: string;
    difficulty?: string;
    prepTime?: number;
    cookTime?: number;
    isCurated?: boolean;
    imageUrl?: string;
  }>;
}

export async function getCollections(): Promise<Collection[]> {
  const { data } = await api.get<{ success: boolean; data: Collection[] }>('/collections');
  return data.data ?? [];
}

export async function getCollection(id: string): Promise<CollectionWithRecipes> {
  const { data } = await api.get<{ success: boolean; data: CollectionWithRecipes }>(`/collections/${id}`);
  return data.data;
}

export async function createCollection(params: { name: string; description?: string }): Promise<Collection> {
  const { data } = await api.post<{ success: boolean; data: Collection }>('/collections', params);
  return data.data;
}

export async function updateCollection(
  id: string,
  params: { name?: string; description?: string; recipeIds?: string[] }
): Promise<Collection> {
  const { data } = await api.put<{ success: boolean; data: Collection }>(`/collections/${id}`, params);
  return data.data;
}

export async function deleteCollection(id: string): Promise<void> {
  await api.delete(`/collections/${id}`);
}
