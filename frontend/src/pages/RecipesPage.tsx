import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';
import { useAuth } from '@/context/AuthContext';

const PER_PAGE = 20;

interface Recipe {
  id: string;
  title: string;
  cuisineType?: string;
  mealType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  isCurated?: boolean;
  isFavorite?: boolean;
  imageUrl?: string | null;
}

interface RecipesResponse {
  success: boolean;
  data: Recipe[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function RecipesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', page],
    queryFn: async () => {
      const { data: res } = await api.get<RecipesResponse>('/recipes', {
        params: { page, limit: PER_PAGE },
      });
      return res;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">Your recipes and curated recipes everyone can use.</p>
        </div>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading recipes">
          {Array.from({ length: 6 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Failed to load recipes. Try again later.</p>
      </div>
    );
  }

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">Recipes</h1>
        <p className="page-subtitle">Your recipes and curated recipes everyone can use.</p>
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
          recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              showFavoriteButton={!!user}
              linkTo="/recipes"
            />
          ))
        )}
      </div>

      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-content-subtle">
            Page {currentPage} of {totalPages} ({total} recipes)
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
