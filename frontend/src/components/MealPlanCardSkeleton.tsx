/**
 * Skeleton placeholder matching meal plan list card (gradient bar, title, date).
 */
export function MealPlanCardSkeleton() {
  return (
    <div className="card-interactive overflow-hidden rounded-[var(--radius-card)]">
      <div className="h-1.5 w-full rounded-t-[var(--radius-card)] skeleton-shimmer" aria-hidden />
      <div className="p-4 sm:p-5 space-y-2">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" aria-hidden />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" aria-hidden />
      </div>
    </div>
  );
}
