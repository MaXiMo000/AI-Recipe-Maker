import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/ui/Loader';

/**
 * Wraps protected content: shows central Loader while auth is resolving,
 * redirects to login if not authenticated, otherwise renders children.
 * Use for any route that requires a logged-in user.
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader variant="page" label="Checking sign-in…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
