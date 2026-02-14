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
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">My recipes</h1>
        <p className="page-subtitle">Recipes you’ve created or saved.</p>
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-12 text-center max-w-md mx-auto">
            <p className="text-content-muted font-medium">No recipes yet.</p>
            <p className="mt-1 text-sm text-content-subtle">Generate one from the Generate page.</p>
            <Link
              to="/generate"
              className="btn-primary inline-flex mt-6 w-full sm:w-auto justify-center"
            >
              Generate recipe
            </Link>
          </div>
        ) : (
          recipes.map((r) => {
            const totalMins = (r.prepTime ?? 0) + (r.cookTime ?? 0);
            const meta = [r.cuisineType, r.mealType, r.difficulty].filter(Boolean);
            return (
              <Link
                key={r.id}
                to={`/recipes/${r.id}`}
                className="card-interactive group block overflow-hidden"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-[var(--radius-card)]" aria-hidden />
                <div className="p-4 sm:p-5">
                  <h2 className="font-display font-semibold text-content group-hover:text-primary-600 transition-colors line-clamp-2 text-lg leading-snug">
                    {r.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {meta.slice(0, 3).map((m) => (
                      <span key={m} className="pill-muted">{m}</span>
                    ))}
                  </div>
                  {totalMins > 0 && (
                    <p className="mt-2 text-xs font-medium text-primary-600">{totalMins} min</p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
