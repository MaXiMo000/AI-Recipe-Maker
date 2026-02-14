import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
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
      <OfflineBanner />
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
