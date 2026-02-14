import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UserPreferences {
  dietary?: string[];
  allergies?: string[];
  skillLevel?: string;
  favoriteCuisines?: string[];
}

interface GenerateParams {
  ingredients: string[];
  preferences?: Partial<UserPreferences>;
}

interface RecipeResponse {
  id: string;
  title: string;
  [key: string]: unknown;
}

export function useRecipeGeneration() {
  const mutation = useMutation({
    mutationFn: async (params: GenerateParams) => {
      const { data } = await api.post<{ success: boolean; data: RecipeResponse }>(
        '/recipes/generate',
        params
      );
      return data.data;
    },
  });
  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
  };
}
