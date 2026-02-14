import { useState, useCallback } from 'react';
import type { UserPreferences } from '../recipe';

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:5000';

type GenerateParams = {
  ingredients: string[];
  preferences?: Partial<UserPreferences>;
};

type RecipeResponse = {
  id: string;
  title: string;
  [key: string]: unknown;
};

export function useRecipeGeneration() {
  const [isPending, setPending] = useState(false);

  const mutate = useCallback(
    (
      params: GenerateParams,
      options?: {
        onSuccess?: (recipe: RecipeResponse) => void;
        onError?: (error: Error) => void;
      }
    ) => {
      setPending(true);
      fetch(`${API_BASE}/api/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((json) => {
          const recipe = json?.data ?? json;
          options?.onSuccess?.(recipe);
        })
        .catch((err) => options?.onError?.(err instanceof Error ? err : new Error(String(err))))
        .finally(() => setPending(false));
    },
    []
  );

  return { mutate, isPending };
}
