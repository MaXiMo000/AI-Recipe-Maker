import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services/api';

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
  /** Optional: 'card' shows compact icon, 'detail' shows label */
  variant?: 'card' | 'detail';
  className?: string;
  /** Prevent click from bubbling (e.g. when inside a Link) */
  stopPropagation?: boolean;
}

export function FavoriteButton({
  recipeId,
  isFavorite,
  variant = 'card',
  className = '',
  stopPropagation = true,
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await api.delete(`/recipes/${recipeId}/favorite`);
      } else {
        await api.post(`/recipes/${recipeId}/favorite`);
      }
    },
    onSuccess: () => {
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['search-recipes'] });
    },
    onError: () => toast.error('Could not update favorites'),
  });

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.preventDefault();
    e.stopPropagation();
    mutation.mutate();
  };

  const isCard = variant === 'card';
  const baseClass =
    'inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  if (isCard) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`${baseClass} p-2 min-h-[44px] min-w-[44px] shadow-md bg-white/90 hover:bg-white border border-[var(--color-border)] hover:scale-110 active:scale-95 ${className}`}
      >
        <HeartIcon
          filled={isFavorite}
          className={`w-5 h-5 ${isFavorite ? 'text-rose-500' : 'text-content-muted hover:text-rose-400'}`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`${baseClass} gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 font-medium ${className}`}
    >
      <HeartIcon
        filled={isFavorite}
        className={`w-5 h-5 shrink-0 ${isFavorite ? 'text-rose-500' : 'text-rose-400'}`}
      />
      <span>{mutation.isPending ? '…' : isFavorite ? 'Saved' : 'Save'}</span>
    </button>
  );
}
