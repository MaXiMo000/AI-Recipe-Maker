import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useRecipeGeneration } from './hooks/useRecipes';
import { UserPreferences } from './recipe';

const toast = {
  success: (msg: string) => console.log('[success]', msg),
  error: (msg: string) => console.error('[error]', msg),
};

export function RecipeGenerator() {
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
          toast.success('Recipe generated successfully!');
          navigate(`/recipes/${recipe.id}`);
        },
        onError: (error) => {
          toast.error('Failed to generate recipe. Please try again.');
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Generate Recipe</h2>
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>

        {/* Ingredient Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What ingredients do you have?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="e.g., chicken, rice, tomatoes..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={addIngredient}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Your ingredients:</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-2"
                >
                  <span>{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(index)}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Toggle */}
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-indigo-600 hover:text-indigo-700 font-medium mb-4"
        >
          {showPreferences ? 'Hide' : 'Show'} Preferences
        </button>

        {/* Preferences Form */}
        {showPreferences && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type
              </label>
              <select
                value={preferences.cuisine || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, cuisine: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Any</option>
                <option value="Italian">Italian</option>
                <option value="Asian">Asian</option>
                <option value="Mexican">Mexican</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="American">American</option>
                <option value="Indian">Indian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level
              </label>
              <select
                value={preferences.skillLevel || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    skillLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Type
              </label>
              <select
                value={preferences.mealType || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, mealType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Any</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Cook Time (minutes)
              </label>
              <input
                type="number"
                value={preferences.maxCookTime || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    maxCookTime: parseInt(e.target.value),
                  })
                }
                placeholder="e.g., 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isPending || ingredients.length === 0}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating your recipe...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Recipe
            </>
          )}
        </button>

        {isPending && (
          <div className="mt-4 text-center text-gray-600">
            <p>Our AI chef is creating something amazing for you...</p>
          </div>
        )}
      </div>
    </div>
  );
}
