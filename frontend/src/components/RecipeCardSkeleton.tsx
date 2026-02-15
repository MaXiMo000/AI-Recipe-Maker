/**
 * Skeleton placeholder matching RecipeCard layout (image area, title, pills, time).
 * Use while recipe lists are loading.
 */
export function RecipeCardSkeleton() {
  return (
    <div className="card-interactive overflow-hidden rounded-[var(--radius-card)]">
      <div className="aspect-[16/10] w-full rounded-t-[var(--radius-card)] skeleton-shimmer" aria-hidden />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-5 w-[80%] rounded skeleton-shimmer" aria-hidden />
        <div className="h-5 w-2/3 rounded skeleton-shimmer" aria-hidden />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full skeleton-shimmer" aria-hidden />
          <div className="h-6 w-20 rounded-full skeleton-shimmer" aria-hidden />
          <div className="h-6 w-14 rounded-full skeleton-shimmer" aria-hidden />
        </div>
        <div className="h-3 w-12 rounded skeleton-shimmer" aria-hidden />
      </div>
    </div>
  );
}
