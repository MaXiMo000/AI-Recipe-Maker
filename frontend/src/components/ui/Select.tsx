import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Any',
  className = '',
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : placeholder;
  const allOptions: SelectOption[] = [{ value: '', label: placeholder }, ...options];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    const idx = allOptions.findIndex((o) => o.value === value);
    if (e.key === 'ArrowDown' && idx < allOptions.length - 1) {
      e.preventDefault();
      onChange(allOptions[idx + 1].value);
    } else if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      onChange(allOptions[idx - 1].value);
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      onChange(allOptions[idx].value);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="input-base flex w-full items-center justify-between gap-2 py-2 text-sm text-left"
      >
        <span className={value ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]'}>
          {displayLabel}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-activedescendant={value ? `${id}-opt-${value}` : undefined}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-1 shadow-lg"
        >
          {allOptions.map((opt) => (
            <li
              key={opt.value || '__any__'}
              id={id ? `${id}-opt-${opt.value || 'any'}` : undefined}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
              }`}
            >
              {value === opt.value ? (
                <span className="text-primary-600" aria-hidden>✓</span>
              ) : (
                <span className="w-4" aria-hidden />
              )}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
