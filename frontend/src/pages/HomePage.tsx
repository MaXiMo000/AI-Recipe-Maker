import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-12 sm:py-20 lg:py-28 px-4 text-center">
      <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-primary-50/80 via-white to-orange-50/60 border border-primary-100/60 p-8 sm:p-12 shadow-lg">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-content">
          Plan meals. Cook smarter.
        </h1>
        <p className="mx-auto mt-4 sm:mt-5 text-base sm:text-lg text-content-muted leading-relaxed">
          Generate recipes from ingredients, build meal plans, and track nutrition—all in one place.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link to="/generate" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Generate a recipe
              </Link>
              <Link to="/search" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Search recipes
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Log in
              </Link>
              <Link to="/search" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-w-[200px]">
                Search recipes
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="mt-10 pt-8 border-t border-primary-100/60">
            <p className="text-sm font-medium text-content-muted mb-3">Quick links</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/recipes" className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-content hover:bg-primary-50 transition-colors">
                Your recipes
              </Link>
              <Link to="/favorites" className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-content hover:bg-primary-50 transition-colors">
                Favorites
              </Link>
              <Link to="/meal-plans" className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-content hover:bg-primary-50 transition-colors">
                Meal plans
              </Link>
              <Link to="/collections" className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-content hover:bg-primary-50 transition-colors">
                Collections
              </Link>
              <Link to="/generate" className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-content hover:bg-primary-50 transition-colors">
                Generate
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
