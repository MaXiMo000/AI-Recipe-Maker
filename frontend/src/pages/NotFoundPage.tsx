import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-6xl font-bold text-stone-300">404</h1>
      <p className="mt-2 text-lg text-stone-600">Page not found.</p>
      <Link to="/" className="mt-6 text-primary-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}
