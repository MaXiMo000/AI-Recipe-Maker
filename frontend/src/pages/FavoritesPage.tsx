import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/services/recipes';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';

const PER_PAGE = 20;

export function FavoritesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
      return next;
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => getFavorites({ page, limit: PER_PAGE }),
    staleTime: 30 * 1000,
  });

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? 1;

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="page-title flex items-center gap-3">
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            Favorites
          </h1>
          <p className="page-subtitle">Recipes you’ve saved. Quick access from here or from any recipe page.</p>
        </div>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading favorites">
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
        <p className="text-error font-medium">Could not load favorites. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title flex items-center gap-3">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          Favorites
        </h1>
        <p className="page-subtitle">
          Recipes you’ve saved. Quick access from here or from any recipe page.
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/50 p-10 sm:p-14">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-400 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-content">
              No favorites yet
            </h2>
            <p className="mt-2 text-content-muted text-sm sm:text-base leading-relaxed">
              When you save a recipe with the heart icon, it will show up here for easy access.
            </p>
            <Link
              to="/recipes"
              className="btn-primary inline-flex mt-8 gap-2"
            >
              Browse recipes
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={{ ...r, isFavorite: true }}
              showFavoriteButton
              linkTo="/recipes"
              variant="favorites"
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-content-subtle">
            {total} {total === 1 ? 'recipe' : 'recipes'} saved
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-content-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
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
