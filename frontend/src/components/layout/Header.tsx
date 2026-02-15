import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useResponsive, getModifierKeyName } from '@/hooks';

const navLinks = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/search', label: 'Search' },
  { to: '/meal-plans', label: 'Meal Plans' },
  { to: '/nutrition', label: 'Nutrition' },
];
const navLinksAuthenticated = [...navLinks, { to: '/favorites', label: 'Favorites' }, { to: '/collections', label: 'Collections' }];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDesktop } = useResponsive();
  const modKey = getModifierKeyName();

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const linkClass = "inline-flex items-center min-h-[2.25rem] text-sm font-medium text-content-muted hover:text-primary-600 transition-colors rounded-md px-2 py-1.5 -mx-2 -my-1.5";
  const mobileLinkClass = "block w-full py-3 text-left text-base font-medium text-content hover:text-primary-600 hover:bg-surface-100 rounded-lg px-4 -mx-4 transition-colors";

  return (
    <header className="no-print sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/98 backdrop-blur-sm shadow-soft safe-area-t">
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-lg sm:text-xl font-semibold text-primary-600 shrink-0">
          AI Recipe Maker
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {(user ? navLinksAuthenticated : navLinks).map(({ to, label }) => (
            <Link key={to} to={to} className={linkClass}>
              {label}
              {to === '/search' && isDesktop && (
                <span className="ml-1 text-content-subtle text-xs">({modKey}+K)</span>
              )}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/generate" className="inline-flex items-center min-h-[2.25rem] rounded-md px-2 py-1.5 -mx-2 -my-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
                Generate
              </Link>
              <Link to="/profile" className={linkClass} title={user.fullName || user.email}>
                <span className="max-w-[120px] truncate">{user.fullName || user.email}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="inline-flex items-center min-h-[2.25rem] rounded-md px-2 py-1.5 -mx-2 -my-1.5 text-sm font-medium text-content-subtle hover:text-content">
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
          className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 rounded-lg text-content-muted hover:bg-surface-100"
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
        <div className="md:hidden border-t border-divider bg-card">
          <nav className="mx-auto max-w-6xl px-4 py-4 space-y-1">
            {(user ? navLinksAuthenticated : navLinks).map(({ to, label }) => (
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
