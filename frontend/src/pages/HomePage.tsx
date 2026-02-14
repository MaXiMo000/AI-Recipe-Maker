import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-10 sm:py-16 lg:py-20 px-2 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-content">
          Plan meals. Cook smarter.
        </h1>
        <p className="mx-auto mt-4 sm:mt-5 text-base sm:text-lg text-content-muted leading-relaxed">
          Generate recipes from ingredients, build meal plans, and track nutrition—all in one place.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-center gap-3 sm:gap-4">
          {user ? (
            <Link to="/generate" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
              Generate a recipe
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Log in
              </Link>
            </>
          )}
          <Link to="/search" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
            Search recipes
          </Link>
        </div>
      </div>
    </div>
  );
}
