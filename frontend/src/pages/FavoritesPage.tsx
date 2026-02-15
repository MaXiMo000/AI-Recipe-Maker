import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/services/recipes';
import { Loader } from '@/components/ui/Loader';
import { FavoriteButton } from '@/components/FavoriteButton';

export function FavoritesPage() {
  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return <Loader variant="page" label="Loading favorites…" />;
  }

  if (error) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Could not load favorites. Try again later.</p>
      </div>
    );
  }

  const list = recipes ?? [];

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

      {list.length === 0 ? (
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
          {list.map((r) => {
            const totalMins = (r.prepTime ?? 0) + (r.cookTime ?? 0);
            const meta = [r.cuisineType, r.mealType, r.difficulty].filter(Boolean);
            return (
              <div
                key={r.id}
                className="card-interactive group relative overflow-hidden"
              >
                <Link to={`/recipes/${r.id}`} className="block">
                  <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-primary-500 rounded-t-[var(--radius-card)]" aria-hidden />
                  <div className="p-4 sm:p-5">
                    <h2 className="font-display font-semibold text-content group-hover:text-primary-600 transition-colors line-clamp-2 text-lg leading-snug pr-10">
                      {r.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.isCurated && <span className="pill pill-primary">Curated</span>}
                      {meta.slice(0, 3).map((m) => (
                        <span key={m} className="pill-muted">{m}</span>
                      ))}
                    </div>
                    {totalMins > 0 && (
                      <p className="mt-2 text-xs font-medium text-primary-600">{totalMins} min</p>
                    )}
                  </div>
                </Link>
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton recipeId={r.id} isFavorite={true} variant="card" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <p className="mt-6 text-sm text-content-subtle">
          {list.length} {list.length === 1 ? 'recipe' : 'recipes'} saved
        </p>
      )}
    </div>
  );
}
