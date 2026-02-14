import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';
import { useTouchHandler } from '@/hooks';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const metaItems = [recipe.cuisineType, recipe.mealType, recipe.difficulty].filter(Boolean);

  return (
    <div className="w-full max-w-3xl mx-auto" {...swipeHandlers}>
      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50"
        >
          <span aria-hidden>←</span>
          Recipes
        </Link>
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="btn-danger text-sm py-2 min-h-[40px]"
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/* Title block */}
      <div className="card-section mb-6">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-content tracking-tight leading-tight">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p className="mt-3 text-content-muted leading-relaxed">{recipe.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 items-center text-sm text-content-subtle">
          {metaItems.length > 0 && (
            <span>{metaItems.join(' · ')}</span>
          )}
          {totalMins > 0 && (
            <>
              {metaItems.length > 0 && <span>·</span>}
              <span>{totalMins} min</span>
            </>
          )}
        </div>
      </div>

      {/* Nutrition */}
      {Object.keys(nutrition).length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold text-content mb-3">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {nutrition.calories != null && (
              <div className="card-section text-center py-3">
                <p className="text-xs font-medium text-content-subtle uppercase tracking-wider">Calories</p>
                <p className="text-xl font-semibold text-content mt-0.5">{nutrition.calories}</p>
              </div>
            )}
            {nutrition.protein != null && (
              <div className="card-section text-center py-3">
                <p className="text-xs font-medium text-content-subtle uppercase tracking-wider">Protein</p>
                <p className="text-xl font-semibold text-content mt-0.5">{nutrition.protein}g</p>
              </div>
            )}
            {nutrition.carbs != null && (
              <div className="card-section text-center py-3">
                <p className="text-xs font-medium text-content-subtle uppercase tracking-wider">Carbs</p>
                <p className="text-xl font-semibold text-content mt-0.5">{nutrition.carbs}g</p>
              </div>
            )}
            {nutrition.fat != null && (
              <div className="card-section text-center py-3">
                <p className="text-xs font-medium text-content-subtle uppercase tracking-wider">Fat</p>
                <p className="text-xl font-semibold text-content mt-0.5">{nutrition.fat}g</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="mb-6">
        <h2 className="font-display text-lg font-semibold text-content mb-3">Ingredients</h2>
        <ul className="card-section space-y-2 list-none p-0">
          {ingredients.map((ing: any, i: number) => (
            <li key={i} className="flex items-start gap-2 py-1.5 border-b border-divider last:border-0 last:pb-0 first:pt-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium mt-0.5">
                {i + 1}
              </span>
              <span className="text-content-muted">
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
        <h2 className="font-display text-lg font-semibold text-content mb-3">Instructions</h2>
        <ol className="space-y-3 list-none p-0">
          {instructions.map((item: { step?: number; instruction?: string; time?: number } | string, i: number) => {
            const text = typeof item === 'string' ? item : (item.instruction ?? (item as any).text ?? '');
            return (
              <li key={i} className="card-section flex gap-4 items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white text-sm font-semibold">
                  {i + 1}
                </span>
                <p className="text-content-muted leading-relaxed pt-0.5 flex-1 min-w-0">{text}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
