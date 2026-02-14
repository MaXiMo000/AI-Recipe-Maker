import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Recipe {
  id: string;
  title: string;
  cuisineType?: string;
  mealType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
}

export function RecipesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data: res } = await api.get<{ success: boolean; data: Recipe[] }>('/recipes');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Failed to load recipes. Try again later.
      </div>
    );
  }

  const recipes = data ?? [];

  return (
    <div className="w-full">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">My recipes</h1>
      <p className="mt-1 text-stone-600 text-sm sm:text-base">Recipes you’ve created or saved.</p>
      <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.length === 0 ? (
          <p className="col-span-full text-stone-500">No recipes yet. Generate one from the Generate page.</p>
        ) : (
          recipes.map((r) => (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <h2 className="font-medium text-stone-900">{r.title}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {[r.cuisineType, r.mealType, r.difficulty].filter(Boolean).join(' · ') || '—'}
              </p>
              {(r.prepTime != null || r.cookTime != null) && (
                <p className="mt-1 text-sm text-stone-500">
                  {(r.prepTime ?? 0) + (r.cookTime ?? 0)} min
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
