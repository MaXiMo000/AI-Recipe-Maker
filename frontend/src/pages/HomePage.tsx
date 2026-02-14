import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-8 sm:py-12 px-2 text-center">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
        Plan meals. Cook smarter.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-stone-600">
        Generate recipes from ingredients, build meal plans, and track nutrition—all in one place.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4">
        {user ? (
          <Link
            to="/generate"
            className="w-full sm:w-auto rounded-lg bg-primary-500 px-6 py-3 min-h-[48px] flex items-center justify-center font-medium text-white hover:bg-primary-600"
          >
            Generate a recipe
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-lg bg-primary-500 px-6 py-3 min-h-[48px] flex items-center justify-center font-medium text-white hover:bg-primary-600"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto rounded-lg border border-stone-300 px-6 py-3 min-h-[48px] flex items-center justify-center font-medium text-stone-700 hover:bg-stone-50"
            >
              Log in
            </Link>
          </>
        )}
        <Link
          to="/search"
          className="w-full sm:w-auto rounded-lg border border-stone-300 px-6 py-3 min-h-[48px] flex items-center justify-center font-medium text-stone-700 hover:bg-stone-50"
        >
          Search recipes
        </Link>
      </div>
    </div>
  );
}
