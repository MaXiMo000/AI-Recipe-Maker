import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-content-subtle mb-6" aria-hidden>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="font-display text-6xl sm:text-7xl font-bold text-content-subtle">404</h1>
      <p className="mt-2 text-lg text-content-muted">Page not found.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary inline-flex">
          Go home
        </Link>
        <Link to="/search" className="btn-secondary inline-flex">
          Search recipes
        </Link>
      </div>
    </div>
  );
}
