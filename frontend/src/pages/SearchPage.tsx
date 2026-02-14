import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function SearchPage() {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

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
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Search recipes</h1>
      <p className="mt-1 text-stone-600 text-sm sm:text-base">Find recipes by keyword or filters.</p>

      <form
        className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="block w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="rounded-md bg-primary-500 px-4 py-2.5 sm:py-2 font-medium text-white hover:bg-primary-600 min-h-[44px] sm:min-h-0 shrink-0"
        >
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="mt-6 h-32 animate-pulse rounded-lg bg-stone-200" />
      ) : (
        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.length === 0 && submitted ? (
            <p className="col-span-full text-stone-500">No recipes found. Try a different search.</p>
          ) : (
            recipes.map((r: any) => (
              <Link
                key={r.id}
                to={`/recipes/${r.id}`}
                className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md"
              >
                <h2 className="font-medium text-stone-900">{r.title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {[r.cuisineType, r.mealType].filter(Boolean).join(' · ') || '—'}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <p className="mt-4 text-sm text-stone-500">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
        </p>
      )}
    </div>
  );
}
