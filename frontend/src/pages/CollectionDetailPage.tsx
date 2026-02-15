import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getCollection, updateCollection } from '@/services/collections';
import { Loader } from '@/components/ui/Loader';
import { RecipeCard } from '@/components/RecipeCard';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => getCollection(id!),
    enabled: !!id,
  });

  const { data: allRecipes } = useQuery({
    queryKey: ['recipes-for-collection'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any[] }>('/recipes', { params: { limit: 100 } });
      return data.data ?? [];
    },
    enabled: addOpen && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (recipeIds: string[]) => updateCollection(id!, { recipeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const addRecipe = (recipeId: string) => {
    const current = collection?.recipeIds ?? [];
    if (current.includes(recipeId)) return;
    updateMutation.mutate([...current, recipeId], {
      onSuccess: () => toast.success('Recipe added'),
      onError: () => toast.error('Failed to add recipe'),
    });
  };

  const removeRecipe = (recipeId: string) => {
    const current = collection?.recipeIds ?? [];
    updateMutation.mutate(current.filter((r) => r !== recipeId), {
      onSuccess: () => toast.success('Removed from collection'),
      onError: () => toast.error('Failed to remove'),
    });
  };

  if (isLoading || !id) {
    return <Loader variant="page" label="Loading collection…" />;
  }

  if (error || !collection) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Collection not found.</p>
        <Link to="/collections" className="mt-2 inline-block text-primary-600 hover:underline font-medium">← Back to collections</Link>
      </div>
    );
  }

  const recipes = collection.recipes ?? [];
  const recipeIdsSet = new Set(collection.recipeIds ?? []);
  const availableToAdd = (allRecipes ?? []).filter((r: any) => !recipeIdsSet.has(r.id));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/collections" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50">
          ← Collections
        </Link>
        <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm py-2 min-h-[40px]">
          Add recipes
        </button>
      </div>

      <header className="mt-4 rounded-2xl bg-gradient-to-br from-primary-50 via-white to-orange-50/50 border border-primary-100/80 p-5 sm:p-6 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-content tracking-tight">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-2 text-content-muted">{collection.description}</p>
        )}
        <p className="mt-2 text-sm text-content-subtle">{recipes.length} recipes</p>
      </header>

      <div className="mt-6 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-8 text-center">
            <p className="text-content-muted font-medium">No recipes in this collection.</p>
            <button type="button" onClick={() => setAddOpen(true)} className="btn-primary mt-3">
              Add recipes
            </button>
          </div>
        ) : (
          recipes.map((r: any) => (
            <div key={r.id} className="relative">
              <RecipeCard
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
                showFavoriteButton={false}
                linkTo="/recipes"
              />
              <button
                type="button"
                onClick={() => removeRecipe(r.id)}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/90 border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-error hover:bg-red-50 shadow"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-recipes-title">
          <div className="w-full max-w-lg my-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
            <h2 id="add-recipes-title" className="font-display text-xl font-semibold text-content">Add recipes</h2>
            <p className="mt-1 text-sm text-content-muted">Choose a recipe to add to this collection.</p>
            <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {availableToAdd.length === 0 ? (
                <li className="text-content-muted text-sm">No more recipes to add, or load more from the Recipes page.</li>
              ) : (
                availableToAdd.slice(0, 50).map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] p-3">
                    <span className="font-medium text-content line-clamp-1">{r.title}</span>
                    <button
                      type="button"
                      onClick={() => addRecipe(r.id)}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-sm py-1.5 px-3 shrink-0"
                    >
                      Add
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary mt-4 w-full sm:w-auto">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
