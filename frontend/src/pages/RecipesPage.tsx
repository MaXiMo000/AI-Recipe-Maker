import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader } from '@/components/ui/Loader';

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
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return <Loader variant="page" label="Loading recipes…" />;
  }

  if (error) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Failed to load recipes. Try again later.</p>
      </div>
    );
  }

  const recipes = data ?? [];

  return (
    <div className="w-full">
      <h1 className="page-title">My recipes</h1>
      <p className="page-subtitle">Recipes you’ve created or saved.</p>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.length === 0 ? (
          <div className="col-span-full card-section text-center py-12 max-w-md mx-auto">
            <p className="text-content-muted">No recipes yet.</p>
            <p className="mt-1 text-sm text-content-subtle">Generate one from the Generate page.</p>
            <Link
              to="/generate"
              className="btn-primary inline-flex mt-4 w-full sm:w-auto justify-center"
            >
              Generate recipe
            </Link>
          </div>
        ) : (
          recipes.map((r) => (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="card-interactive group block"
            >
              <h2 className="font-semibold text-content group-hover:text-primary-600 transition-colors line-clamp-2">
                {r.title}
              </h2>
              <p className="mt-1.5 text-sm text-content-subtle">
                {[r.cuisineType, r.mealType, r.difficulty].filter(Boolean).join(' · ') || '—'}
              </p>
              {(r.prepTime != null || r.cookTime != null) && (
                <p className="mt-1 text-xs text-content-subtle">
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
