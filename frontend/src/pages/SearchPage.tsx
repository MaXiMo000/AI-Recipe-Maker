import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader } from '@/components/ui/Loader';
import { usePersistedState, useKeyboardShortcuts, KeyboardShortcuts } from '@/hooks';

const SEARCH_INPUT_KEY = 'recipe-search-query';

export function SearchPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = usePersistedState(SEARCH_INPUT_KEY, '');
  const [submitted, setSubmitted] = usePersistedState(`${SEARCH_INPUT_KEY}-submitted`, '');

  useKeyboardShortcuts({
    [KeyboardShortcuts.CTRL_K]: (e) => {
      e.preventDefault();
      searchInputRef.current?.focus();
    },
    [KeyboardShortcuts.CTRL_F]: (e) => {
      e.preventDefault();
      searchInputRef.current?.focus();
    },
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['search-recipes', submitted],
    queryFn: async () => {
      const { data: res } = await api.get<{ success: boolean; data: any[]; pagination: any }>('/search/recipes', {
        params: { q: submitted || undefined, limit: 20 },
      });
      return res;
    },
    enabled: true,
  });

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="w-full">
      <h1 className="page-title">Search recipes</h1>
      <p className="page-subtitle">Find recipes by keyword.</p>

      <form
        className="mt-6 flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
        }}
      >
        <input
          ref={searchInputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. chicken, pasta, quick dinner..."
          className="input-base flex-1"
        />
        <button type="submit" className="btn-primary shrink-0 sm:w-auto w-full">
          Search
        </button>
      </form>

      {isLoading ? (
        <Loader variant="inline" label="Searching…" className="mt-8" />
      ) : (
        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.length === 0 && submitted ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-12 text-center">
              <p className="text-content-muted font-medium">No recipes found.</p>
              <p className="mt-1 text-sm text-content-subtle">Try a different search term.</p>
            </div>
          ) : (
            recipes.map((r: any) => {
              const meta = [r.cuisineType, r.mealType].filter(Boolean);
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
                      {meta.map((m: string) => (
                        <span key={m} className="pill-muted">{m}</span>
                      ))}
                      {meta.length === 0 && <span className="pill-muted">Recipe</span>}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <p className="mt-4 text-sm text-content-subtle">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
        </p>
      )}
    </div>
  );
}
