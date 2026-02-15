import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollections, updateCollection, createCollection } from '@/services/collections';
import { toast } from 'sonner';

interface AddToCollectionModalProps {
  open: boolean;
  recipeId: string;
  onClose: () => void;
}

export function AddToCollectionModal({ open, recipeId, onClose }: AddToCollectionModalProps) {
  const queryClient = useQueryClient();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createName, setCreateName] = useState('');

  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
    enabled: open,
  });

  useEffect(() => {
    if (open && collections) {
      const withRecipe = new Set<string>();
      collections.forEach((c) => {
        if (c.recipeIds?.includes(recipeId)) withRecipe.add(c.id);
      });
      setSelected(withRecipe);
    }
  }, [open, collections, recipeId]);

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

  const updateMutation = useMutation({
    mutationFn: ({ id, recipeIds }: { id: string; recipeIds: string[] }) => updateCollection(id, { recipeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createCollection({ name: name.trim() }),
    onSuccess: (newCol) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      updateMutation.mutate(
        { id: newCol.id, recipeIds: [recipeId] },
        { onSuccess: () => toast.success('Created and added to collection'), onError: () => toast.error('Failed to add') }
      );
      setCreateName('');
    },
    onError: () => toast.error('Failed to create collection'),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    const list = collections ?? [];
    list.forEach((c) => {
      const hasRecipe = c.recipeIds?.includes(recipeId);
      const wantSelected = selected.has(c.id);
      if (hasRecipe && !wantSelected) {
        updateMutation.mutate(
          { id: c.id, recipeIds: (c.recipeIds ?? []).filter((r) => r !== recipeId) },
          { onSuccess: () => toast.success('Removed from collection'), onError: () => toast.error('Failed to update') }
        );
      } else if (!hasRecipe && wantSelected) {
        updateMutation.mutate(
          { id: c.id, recipeIds: [...(c.recipeIds ?? []), recipeId] },
          { onSuccess: () => toast.success('Added to collection'), onError: () => toast.error('Failed to add') }
        );
      }
    });
    onClose();
  };

  if (!open) return null;

  const list = collections ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="add-to-collection-title" aria-describedby="add-to-collection-desc">
      <div ref={wrapRef} className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg p-5 sm:p-6">
        <h2 id="add-to-collection-title" className="font-display text-xl font-semibold text-content">Add to collection</h2>
        <p id="add-to-collection-desc" className="mt-1 text-sm text-content-muted">Select collections to add this recipe to.</p>

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-content-muted text-sm">No collections yet. Create one below.</p>
          ) : (
            list.map((c) => (
              <label key={c.id} className="flex items-center gap-3 cursor-pointer rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface)]">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded border-[var(--color-border)]"
                />
                <span className="font-medium text-content">{c.name}</span>
                <span className="text-xs text-content-subtle">{(c.recipeIds?.length ?? 0)} recipes</span>
              </label>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-sm font-medium text-content-muted mb-2">Or create new</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Collection name"
              className="input-base flex-1 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => createName.trim() && createMutation.mutate(createName)}
              disabled={!createName.trim() || createMutation.isPending}
              className="btn-primary text-sm py-2"
            >
              Create & add
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 min-h-[44px]">
            Cancel
          </button>
          <button type="button" onClick={save} className="btn-primary flex-1 min-h-[44px]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
