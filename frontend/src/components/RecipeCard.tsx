import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FavoriteButton } from '@/components/FavoriteButton';

export interface RecipeCardRecipe {
  id: string;
  title: string;
  cuisineType?: string;
  mealType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  isCurated?: boolean;
  isFavorite?: boolean;
  imageUrl?: string | null;
}

interface RecipeCardProps {
  recipe: RecipeCardRecipe;
  showFavoriteButton?: boolean;
  linkTo?: string;
  /** Optional: use rose gradient (e.g. Favorites page) */
  variant?: 'default' | 'favorites';
}

export function RecipeCard({
  recipe,
  showFavoriteButton = false,
  linkTo = '/recipes',
  variant = 'default',
}: RecipeCardProps) {
  const [imgError, setImgError] = useState(false);
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const meta = [recipe.cuisineType, recipe.mealType, recipe.difficulty].filter(Boolean);
  const showImage = recipe.imageUrl && !imgError;
  const gradientClass =
    variant === 'favorites'
      ? 'bg-gradient-to-r from-rose-400 to-primary-500'
      : 'bg-gradient-to-r from-primary-400 to-primary-600';

  return (
    <div className="card-interactive group relative overflow-hidden">
      <Link to={`${linkTo}/${recipe.id}`} className="block">
        {showImage ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[var(--radius-card)] bg-[var(--color-surface)]">
            <img
              src={recipe.imageUrl!}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className={`h-1.5 w-full ${gradientClass} rounded-t-[var(--radius-card)]`} aria-hidden />
        )}
        <div className={`p-4 sm:p-5 ${showFavoriteButton ? 'pr-12' : ''}`}>
          <h2 className="font-display font-semibold text-content group-hover:text-primary-600 transition-colors line-clamp-2 text-lg leading-snug">
            {recipe.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.isCurated && <span className="pill pill-primary">Curated</span>}
            {meta.slice(0, 3).map((m) => (
              <span key={m} className="pill-muted">{m}</span>
            ))}
          </div>
          {totalMins > 0 && (
            <p className="mt-2 text-xs font-medium text-primary-600">{totalMins} min</p>
          )}
        </div>
      </Link>
      {showFavoriteButton && (
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton recipeId={recipe.id} isFavorite={recipe.isFavorite ?? false} variant="card" />
        </div>
      )}
    </div>
  );
}
