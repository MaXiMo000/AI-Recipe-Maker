import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/search', label: 'Search' },
  { to: '/meal-plans', label: 'Meal Plans' },
  { to: '/nutrition', label: 'Nutrition' },
];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const linkClass = "text-sm font-medium text-stone-600 hover:text-primary-600";
  const mobileLinkClass = "block w-full py-3 text-left text-base font-medium text-stone-700 hover:text-primary-600 hover:bg-stone-50 rounded-lg px-4 -mx-4";

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="font-display text-lg sm:text-xl font-semibold text-primary-600 shrink-0">
          AI Recipe Maker
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={linkClass}>
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/generate" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Generate
              </Link>
              <Link to="/profile" className={linkClass} title={user.fullName || user.email}>
                <span className="max-w-[120px] truncate inline-block">{user.fullName || user.email}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="text-sm font-medium text-stone-500 hover:text-stone-700">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Log in</Link>
              <Link to="/register" className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 rounded-lg text-stone-600 hover:bg-stone-100"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className={`h-0.5 w-5 bg-current rounded transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-5 bg-current rounded ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-5 bg-current rounded transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-4 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/generate" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  Generate
                </Link>
                <Link to="/profile" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  {user.fullName || user.email}
                </Link>
                <button type="button" onClick={handleLogout} className={mobileLinkClass}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="block w-full py-3 text-center text-base font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600" onClick={() => setMobileOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
