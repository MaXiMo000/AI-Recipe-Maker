import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipeGeneration } from '@/hooks/useRecipes';
import type { UserPreferences } from '@/hooks/useRecipes';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';

export function GenerateRecipePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  if (isPending) {
    return <Loader variant="page" label="Generating recipe…" />;
  }

  const handleGenerate = () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }
    generateRecipe(
      { ingredients, preferences },
      {
        onSuccess: (recipe) => {
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
          queryClient.invalidateQueries({ queryKey: ['search-recipes'] });
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
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="page-title">Generate recipe</h1>
      <p className="page-subtitle">Add ingredients you have; we’ll suggest a recipe.</p>

      <div className="mt-6 sm:mt-8 card-section">
        <label className="block text-sm font-medium text-content-muted mb-2">Ingredients</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
            placeholder="e.g. chicken, rice, tomatoes"
            className="input-base flex-1"
          />
          <button
            type="button"
            onClick={addIngredient}
            className="btn-primary shrink-0 w-full sm:w-auto"
          >
            Add
          </button>
        </div>

        {ingredients.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ingredients.map((ing, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm text-primary-800 font-medium"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="hover:bg-primary-200 rounded-full p-0.5 -mr-0.5 transition-colors"
                  aria-label={`Remove ${ing}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {showPreferences ? 'Hide' : 'Show'} preferences
        </button>
        {showPreferences && (
          <div className="mt-4 card-section grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">Cuisine</label>
              <input
                type="text"
                value={preferences.favoriteCuisines?.[0] ?? ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, favoriteCuisines: e.target.value ? [e.target.value] : undefined })
                }
                placeholder="e.g. Italian"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">Dietary</label>
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
                className="input-base"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={ingredients.length === 0}
          className="btn-primary w-full py-3"
        >
          Generate recipe
        </button>
      </div>
    </div>
  );
}
