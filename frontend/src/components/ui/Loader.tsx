/**
 * Centralized loader used across the app (auth check, page data, etc.).
 * One consistent look everywhere.
 */
interface LoaderProps {
  /** Optional label below the spinner */
  label?: string;
  /** 'page' = full min-height centering; 'inline' = no min-height, compact */
  variant?: 'page' | 'inline';
  /** Spinner size: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

export function Loader({ label, variant = 'page', size = 'md', className = '' }: LoaderProps) {
  const wrapperClass =
    variant === 'page'
      ? 'flex min-h-[40vh] flex-col items-center justify-center gap-3'
      : 'flex flex-col items-center justify-center gap-2';

  return (
    <div className={`${wrapperClass} ${className}`.trim()} role="status" aria-label={label ?? 'Loading'}>
      <div
        className={`animate-spin rounded-full border-gray-200 ${sizeClasses[size]}`}
        style={{ borderTopColor: 'var(--color-primary-500, #f97316)' }}
      />
      {label ? (
        <span className="text-sm text-gray-500">{label}</span>
      ) : null}
    </div>
  );
}
