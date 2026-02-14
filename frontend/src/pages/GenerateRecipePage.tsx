import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeGeneration } from '@/hooks/useRecipes';
import type { UserPreferences } from '@/hooks/useRecipes';
import { toast } from 'sonner';

export function GenerateRecipePage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [showPreferences, setShowPreferences] = useState(false);

  const { mutate: generateRecipe, isPending } = useRecipeGeneration();

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }
    generateRecipe(
      { ingredients, preferences },
      {
        onSuccess: (recipe) => {
          toast.success('Recipe generated!');
          navigate(`/recipes/${recipe.id}`);
        },
        onError: () => {
          toast.error('Failed to generate recipe. Please try again.');
        },
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-2">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Generate recipe</h1>
      <p className="mt-1 text-stone-600 text-sm sm:text-base">Add ingredients you have; we’ll suggest a recipe.</p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700">Ingredients</label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
            placeholder="e.g. chicken, rice, tomatoes"
            className="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addIngredient}
            className="rounded-md bg-primary-500 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-sm font-medium text-white hover:bg-primary-600 shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
            >
              {ing}
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="hover:bg-primary-200 rounded-full p-0.5"
                aria-label={`Remove ${ing}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {showPreferences ? 'Hide' : 'Show'} preferences
        </button>
        {showPreferences && (
          <div className="mt-4 grid gap-4 rounded-lg bg-stone-100 p-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Cuisine</label>
              <input
                type="text"
                value={preferences.favoriteCuisines?.[0] ?? ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, favoriteCuisines: e.target.value ? [e.target.value] : undefined })
                }
                placeholder="e.g. Italian"
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Dietary</label>
              <input
                type="text"
                value={preferences.dietary?.join(', ') ?? ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    dietary: e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined,
                  })
                }
                placeholder="e.g. vegetarian"
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || ingredients.length === 0}
          className="w-full rounded-md bg-primary-500 py-3 min-h-[48px] font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {isPending ? 'Generating…' : 'Generate recipe'}
        </button>
      </div>
    </div>
  );
}
