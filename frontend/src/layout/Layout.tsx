import { useNavigate, Link, Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useKeyboardShortcuts, KeyboardShortcuts } from '@/hooks';

export function Layout() {
  const navigate = useNavigate();

  useKeyboardShortcuts({
    [KeyboardShortcuts.CTRL_K]: (e) => {
      e.preventDefault();
      navigate('/search');
    },
    [KeyboardShortcuts.CTRL_F]: (e) => {
      e.preventDefault();
      navigate('/search');
    },
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OfflineBanner />
      <Header />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-6 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-content-muted">
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <Link to="/search" className="hover:text-primary-600 transition-colors">Search</Link>
          </nav>
          <p>© {new Date().getFullYear()} AI Recipe Maker</p>
        </div>
      </footer>
    </div>
  );
}
