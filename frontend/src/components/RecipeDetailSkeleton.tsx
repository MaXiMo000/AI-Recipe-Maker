/**
 * Skeleton for recipe detail page (image, title, description, sections).
 */
export function RecipeDetailSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-12" aria-busy="true" aria-label="Loading recipe">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="h-9 w-24 rounded skeleton-shimmer" aria-hidden />
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-lg skeleton-shimmer" aria-hidden />
          <div className="h-10 w-10 rounded-lg skeleton-shimmer" aria-hidden />
        </div>
      </div>
      <div className="aspect-[16/10] w-full rounded-2xl skeleton-shimmer mb-6 max-h-[280px] sm:max-h-[320px]" aria-hidden />
      <div className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 mb-6 space-y-3">
        <div className="h-8 w-[80%] rounded skeleton-shimmer" aria-hidden />
        <div className="h-4 w-full rounded skeleton-shimmer" aria-hidden />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" aria-hidden />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 rounded-full skeleton-shimmer" aria-hidden />
          <div className="h-6 w-20 rounded-full skeleton-shimmer" aria-hidden />
          <div className="h-6 w-14 rounded-full skeleton-shimmer" aria-hidden />
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="h-5 w-32 rounded skeleton-shimmer mb-3" aria-hidden />
          <ul className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="h-4 rounded skeleton-shimmer w-full max-w-md" aria-hidden />
            ))}
          </ul>
        </div>
        <div>
          <div className="h-5 w-28 rounded skeleton-shimmer mb-3" aria-hidden />
          <ol className="space-y-2 list-decimal list-inside">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="h-4 rounded skeleton-shimmer w-full max-w-lg" aria-hidden />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
