import { useState, useEffect, useRef } from 'react';

export interface ModifyRecipeForm {
  servings?: number;
  dietary: string[];
  reduceTime: boolean;
  simplify: boolean;
  makeHealthier: boolean;
  substitutions: Record<string, string>;
}

interface ModifyRecipeModalProps {
  open: boolean;
  currentServings: number;
  onClose: () => void;
  onSubmit: (form: ModifyRecipeForm) => void;
  loading: boolean;
}

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto'];

export function ModifyRecipeModal({
  open,
  currentServings,
  onClose,
  onSubmit,
  loading,
}: ModifyRecipeModalProps) {
  const [servings, setServings] = useState(currentServings);
  const [dietary, setDietary] = useState<string[]>([]);
  const [reduceTime, setReduceTime] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [makeHealthier, setMakeHealthier] = useState(false);
  const [subFrom, setSubFrom] = useState('');
  const [subTo, setSubTo] = useState('');
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setServings(currentServings);
      setDietary([]);
      setReduceTime(false);
      setSimplify(false);
      setMakeHealthier(false);
      setSubstitutions({});
      setSubFrom('');
      setSubTo('');
    }
  }, [open, currentServings]);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const root = wrapRef.current;
    const focusable = root?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable?.[0] as HTMLElement)?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const list = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      prevActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleDietary = (opt: string) => {
    setDietary((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const addSubstitution = () => {
    const from = subFrom.trim();
    const to = subTo.trim();
    if (from) {
      setSubstitutions((prev) => ({ ...prev, [from]: to }));
      setSubFrom('');
      setSubTo('');
    }
  };

  const removeSubstitution = (from: string) => {
    setSubstitutions((prev) => {
      const next = { ...prev };
      delete next[from];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      servings: servings !== currentServings ? servings : undefined,
      dietary: dietary.length ? dietary : undefined,
      reduceTime,
      simplify,
      makeHealthier,
      substitutions: Object.keys(substitutions).length ? substitutions : undefined,
    } as ModifyRecipeForm);
  };

  const subs = substitutions;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modify-recipe-title"
      aria-describedby="modify-recipe-desc"
    >
      <div
        ref={wrapRef}
        className="w-full max-w-lg my-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modify-recipe-title" className="font-display text-xl font-semibold text-content">
          Modify recipe with AI
        </h2>
        <p id="modify-recipe-desc" className="mt-1 text-sm text-content-muted">
          We’ll create a new version based on your choices.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="modify-servings" className="block text-sm font-medium text-content-muted mb-1">
              Servings
            </label>
            <input
              id="modify-servings"
              type="number"
              min={1}
              max={24}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 4)}
              className="input-base w-24"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-content-muted mb-2">Dietary</span>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleDietary(opt)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    dietary.includes(opt)
                      ? 'bg-primary-500 text-white'
                      : 'bg-[var(--color-surface)] text-content-muted hover:bg-primary-100 hover:text-primary-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reduceTime}
                onChange={(e) => setReduceTime(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              <span className="text-sm text-content">Reduce time</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e) => setSimplify(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              <span className="text-sm text-content">Simplify</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={makeHealthier}
                onChange={(e) => setMakeHealthier(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              <span className="text-sm text-content">Make healthier</span>
            </label>
          </div>

          <div>
            <span className="block text-sm font-medium text-content-muted mb-2">Substitutions (optional)</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ingredient to replace"
                value={subFrom}
                onChange={(e) => setSubFrom(e.target.value)}
                className="input-base flex-1 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Replace with"
                value={subTo}
                onChange={(e) => setSubTo(e.target.value)}
                className="input-base flex-1 py-2 text-sm"
              />
              <button type="button" onClick={addSubstitution} className="btn-secondary text-sm py-2">
                Add
              </button>
            </div>
            {Object.entries(subs).length > 0 && (
              <ul className="mt-2 space-y-1">
                {Object.entries(subs).map(([from, to]) => (
                  <li key={from} className="flex items-center gap-2 text-sm">
                    <span className="text-content-muted">{from} → {to || '(omit)'}</span>
                    <button type="button" onClick={() => removeSubstitution(from)} className="text-error hover:underline">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto min-h-[44px]">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto min-h-[44px]">
              {loading ? 'Modifying…' : 'Modify recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
