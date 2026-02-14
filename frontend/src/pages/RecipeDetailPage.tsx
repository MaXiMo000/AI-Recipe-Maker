import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Recipe not found. <Link to="/recipes" className="underline">Back to recipes</Link>
      </div>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const nutrition = recipe.nutritionalInfo || {};

  return (
    <div className="w-full max-w-3xl">
      <Link to="/recipes" className="text-sm text-primary-600 hover:underline">← Recipes</Link>
      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 break-words">{recipe.title}</h1>
          <p className="mt-2 text-stone-600">{recipe.description}</p>
          <p className="mt-2 text-sm text-stone-500">
            {[recipe.cuisineType, recipe.mealType, recipe.difficulty].filter(Boolean).join(' · ')}
            {(recipe.prepTime != null || recipe.cookTime != null) &&
              ` · ${(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {Object.keys(nutrition).length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-medium text-stone-900">Nutrition (per serving)</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-600">
            {nutrition.calories != null && <span>Calories: {nutrition.calories}</span>}
            {nutrition.protein != null && <span>Protein: {nutrition.protein}g</span>}
            {nutrition.carbs != null && <span>Carbs: {nutrition.carbs}g</span>}
            {nutrition.fat != null && <span>Fat: {nutrition.fat}g</span>}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium text-stone-900">Ingredients</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700">
          {ingredients.map((ing: any, i: number) => (
            <li key={i}>
              {typeof ing === 'string' ? ing : [ing.amount, ing.unit, ing.name || ing.ingredient].filter(Boolean).join(' ')}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium text-stone-900">Instructions</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-stone-700">
          {instructions.map((step: string, i: number) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
