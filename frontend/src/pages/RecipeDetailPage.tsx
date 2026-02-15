import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useTouchHandler } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { handleSwipe } = useTouchHandler();
  const swipeHandlers = handleSwipe({ onSwipeRight: () => navigate('/recipes') });

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any }>(`/recipes/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted');
      navigate('/recipes');
    },
    onError: () => toast.error('Failed to delete recipe'),
  });

  if (isLoading || !id) {
    return <Loader variant="page" label="Loading recipe…" />;
  }

  if (error || !recipe) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Recipe not found.</p>
        <Link to="/recipes" className="mt-2 inline-block text-primary-600 hover:underline font-medium">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const nutrition = recipe.nutritionalInfo || {};
  const healthBenefits = Array.isArray(recipe.healthBenefits) ? recipe.healthBenefits : [];
  const healthConcerns = Array.isArray(recipe.healthConcerns) ? recipe.healthConcerns : [];
  const hasHealthNotes = healthBenefits.length > 0 || healthConcerns.length > 0;
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const metaItems = [recipe.cuisineType, recipe.mealType, recipe.difficulty].filter(Boolean);

  return (
    <div className="w-full max-w-3xl mx-auto pb-12" {...swipeHandlers}>
      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50"
        >
          <span aria-hidden>←</span>
          Recipes
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <FavoriteButton
              recipeId={recipe.id!}
              isFavorite={recipe.isFavorite ?? false}
              variant="detail"
              stopPropagation={false}
            />
          )}
          {!recipe.isCurated && (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger text-sm py-2 min-h-[40px]"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Hero title block */}
      <header className="rounded-2xl bg-gradient-to-br from-primary-50 via-white to-orange-50/50 border border-primary-100/80 p-5 sm:p-6 mb-6 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-content tracking-tight leading-tight">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p className="mt-3 text-content-muted leading-relaxed text-sm sm:text-base max-w-2xl">
            {recipe.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {metaItems.map((item: string) => (
            <span key={item} className="pill-primary">{item}</span>
          ))}
          {totalMins > 0 && (
            <span className="pill-muted">{totalMins} min</span>
          )}
        </div>
      </header>

      {/* Nutrition */}
      {Object.keys(nutrition).length > 0 && (
        <section className="mb-8">
          <h2 className="section-heading">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {nutrition.calories != null && (
              <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-4 text-center">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Calories</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{nutrition.calories}</p>
              </div>
            )}
            {nutrition.protein != null && (
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4 text-center">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Protein</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{nutrition.protein}g</p>
              </div>
            )}
            {nutrition.carbs != null && (
              <div className="rounded-xl bg-sky-50/80 border border-sky-100 p-4 text-center">
                <p className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Carbs</p>
                <p className="text-2xl font-bold text-sky-900 mt-1">{nutrition.carbs}g</p>
              </div>
            )}
            {nutrition.fat != null && (
              <div className="rounded-xl bg-rose-50/80 border border-rose-100 p-4 text-center">
                <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Fat</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{nutrition.fat}g</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Health: benefits & concerns */}
      {hasHealthNotes && (
        <section className="mb-8">
          <h2 className="section-heading">Health</h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border)]">
            {healthBenefits.length > 0 && (
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Benefits</p>
                <ul className="list-disc list-inside space-y-1 text-content text-sm">
                  {healthBenefits.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {healthConcerns.length > 0 && (
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Things to keep in mind</p>
                <ul className="list-disc list-inside space-y-1 text-content text-sm">
                  {healthConcerns.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="mb-8">
        <h2 className="section-heading">Ingredients</h2>
        <ul className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)] overflow-hidden">
          {ingredients.map((ing: any, i: number) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 bg-white hover:bg-primary-50/30 transition-colors"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-content min-w-0">
                {typeof ing === 'string'
                  ? ing
                  : [ing.amount, ing.unit, ing.name || ing.ingredient].filter(Boolean).join(' ')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Instructions */}
      <section>
        <h2 className="section-heading">Instructions</h2>
        <div className="relative">
          {/* vertical line on desktop */}
          <div className="hidden sm:block absolute left-4 top-2 bottom-2 w-0.5 bg-primary-100 rounded-full" aria-hidden />
          <ol className="space-y-4 list-none p-0">
            {instructions.map((item: { step?: number; instruction?: string; time?: number } | string, i: number) => {
              const text = typeof item === 'string' ? item : (item.instruction ?? (item as any).text ?? '');
              return (
                <li key={i} className="relative flex gap-4 sm:gap-5 items-start">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white text-sm font-bold shadow-md">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                    <p className="text-content leading-relaxed">{text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
