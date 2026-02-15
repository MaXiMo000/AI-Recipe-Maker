import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';

const PER_PAGE = 20;

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest first', sort: 'createdAt', order: 'desc' },
  { value: 'createdAt_asc', label: 'Oldest first', sort: 'createdAt', order: 'asc' },
  { value: 'title_asc', label: 'Title A–Z', sort: 'title', order: 'asc' },
  { value: 'title_desc', label: 'Title Z–A', sort: 'title', order: 'desc' },
  { value: 'totalTime_asc', label: 'Shortest time', sort: 'totalTime', order: 'asc' },
  { value: 'totalTime_desc', label: 'Longest time', sort: 'totalTime', order: 'desc' },
] as const;

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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = searchParams.get('sort') ?? 'createdAt';
  const orderParam = searchParams.get('order') ?? 'desc';
  const sortValue = `${sortParam}_${orderParam}`;
  const isValidSort = SORT_OPTIONS.some((o) => o.value === sortValue);
  const sort = isValidSort ? sortParam : 'createdAt';
  const order = isValidSort ? orderParam : 'desc';

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
      return next;
    });
  };

  const setSortOrder = (value: string) => {
    const option = SORT_OPTIONS.find((o) => o.value === value);
    if (!option) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sort', option.sort);
      next.set('order', option.order);
      next.delete('page');
      return next;
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', page, sort, order],
    queryFn: async () => {
      const { data: res } = await api.get<RecipesResponse>('/recipes', {
        params: { page, limit: PER_PAGE, sort, order },
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
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">Your recipes and curated recipes everyone can use.</p>
        </div>
        <div className="flex items-center gap-2 min-w-0 sm:min-w-[200px]">
          <label htmlFor="recipes-sort" className="text-sm font-medium text-content-muted shrink-0">
            Sort
          </label>
          <Select
            id="recipes-sort"
            value={sortValue}
            onChange={setSortOrder}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            className="flex-1 min-w-0"
          />
        </div>
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
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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
