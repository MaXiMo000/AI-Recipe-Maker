import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardShortcuts, KeyboardShortcuts } from '@/hooks';

const PER_PAGE = 20;
const CUISINE_OPTIONS = [
  { value: 'Italian', label: 'Italian' },
  { value: 'Mexican', label: 'Mexican' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Asian', label: 'Asian' },
  { value: 'American', label: 'American' },
  { value: 'International', label: 'International' },
];
const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SearchPage() {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const cuisineType = searchParams.get('cuisineType') ?? '';
  const mealType = searchParams.get('mealType') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const maxTime = searchParams.get('maxTime') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const hasFilters = cuisineType || mealType || difficulty || maxTime;

  const setParams = (updates: Record<string, string | number>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        const s = String(v).trim();
        if (s) next.set(k, s);
        else next.delete(k);
      });
      next.delete('page');
      return next;
    });
  };

  const setPageOnly = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
      return next;
    });
  };

  const clearFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('cuisineType');
      next.delete('mealType');
      next.delete('difficulty');
      next.delete('maxTime');
      next.delete('page');
      return next;
    });
  };

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
    queryKey: ['search-recipes', q, cuisineType, mealType, difficulty, maxTime, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: PER_PAGE, page };
      if (q) params.q = q;
      if (cuisineType) params.cuisineType = cuisineType;
      if (mealType) params.mealType = mealType;
      if (difficulty) params.difficulty = difficulty;
      if (maxTime && !Number.isNaN(Number(maxTime))) params.maxTime = Number(maxTime);
      const { data: res } = await api.get<{ success: boolean; data: any[]; pagination: any }>('/search/recipes', { params });
      return res;
    },
    enabled: true,
  });

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="w-full">
      <h1 className="page-title">Search recipes</h1>
      <p className="page-subtitle">Find recipes by keyword and filters.</p>

      <form
        className="mt-6 flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const value = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value?.trim() ?? '';
          setParams({ q: value });
        }}
      >
        <input
          ref={searchInputRef}
          name="q"
          type="search"
          value={q}
          onChange={(e) => setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const v = e.target.value;
            if (v) next.set('q', v);
            else next.delete('q');
            next.delete('page');
            return next;
          })}
          placeholder="e.g. chicken, pasta, quick dinner..."
          className="input-base flex-1"
        />
        <button type="submit" className="btn-primary shrink-0 sm:w-auto w-full">
          Search
        </button>
      </form>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="btn-secondary text-sm py-2 px-3 md:hidden"
        >
          {filtersOpen ? 'Hide filters' : 'Filters'}
          {hasFilters && <span className="ml-1.5 text-primary-600">({[cuisineType, mealType, difficulty, maxTime].filter(Boolean).length})</span>}
        </button>
        <div className={`mt-3 gap-3 flex flex-wrap items-end ${filtersOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="min-w-[140px]">
            <label htmlFor="search-cuisine" className="block text-xs font-medium text-content-muted mb-1">Cuisine</label>
            <Select
              id="search-cuisine"
              value={cuisineType}
              onChange={(v) => setParams({ cuisineType: v })}
              options={CUISINE_OPTIONS}
              placeholder="Any"
              aria-label="Cuisine filter"
            />
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="search-meal" className="block text-xs font-medium text-content-muted mb-1">Meal type</label>
            <Select
              id="search-meal"
              value={mealType}
              onChange={(v) => setParams({ mealType: v })}
              options={MEAL_TYPE_OPTIONS}
              placeholder="Any"
              aria-label="Meal type filter"
            />
          </div>
          <div className="min-w-[120px]">
            <label htmlFor="search-difficulty" className="block text-xs font-medium text-content-muted mb-1">Difficulty</label>
            <Select
              id="search-difficulty"
              value={difficulty}
              onChange={(v) => setParams({ difficulty: v })}
              options={DIFFICULTY_OPTIONS}
              placeholder="Any"
              aria-label="Difficulty filter"
            />
          </div>
          <div className="min-w-[120px]">
            <label htmlFor="search-maxtime" className="block text-xs font-medium text-content-muted mb-1">Max time (min)</label>
            <input
              id="search-maxtime"
              type="number"
              min={1}
              placeholder="Any"
              value={maxTime}
              onChange={(e) => setParams({ maxTime: e.target.value })}
              className="input-base w-full min-h-[44px] sm:min-h-[40px] py-2 text-sm"
            />
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Searching recipes">
          {Array.from({ length: 6 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.length === 0 && (q || hasFilters) ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-12 text-center">
              <p className="text-content-muted font-medium">No recipes found.</p>
              <p className="mt-1 text-sm text-content-subtle">Try a different search term.</p>
            </div>
          ) : (
            recipes.map((r: any) => (
              <RecipeCard
                key={r.id}
                recipe={{
                  id: r.id,
                  title: r.title,
                  cuisineType: r.cuisineType,
                  mealType: r.mealType,
                  difficulty: r.difficulty,
                  prepTime: r.prepTime,
                  cookTime: r.cookTime,
                  isCurated: r.isCurated,
                  isFavorite: r.isFavorite,
                  imageUrl: r.imageUrl,
                }}
                showFavoriteButton={!!user}
                linkTo="/recipes"
              />
            ))
          )}
        </div>
      )}
      {pagination && total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-content-subtle">
            Page {currentPage} of {totalPages} ({total} results)
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageOnly(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPageOnly(Math.min(totalPages, currentPage + 1))}
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
