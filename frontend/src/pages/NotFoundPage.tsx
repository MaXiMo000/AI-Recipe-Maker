import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-6xl sm:text-7xl font-bold text-content-subtle">404</h1>
      <p className="mt-2 text-lg text-content-muted">Page not found.</p>
      <Link to="/" className="mt-6 btn-primary inline-flex">
        Go home
      </Link>
    </div>
  );
}
