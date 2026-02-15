import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCollections, createCollection, deleteCollection } from '@/services/collections';
import { Loader } from '@/components/ui/Loader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  });

  const createMutation = useMutation({
    mutationFn: () => createCollection({ name: newName.trim(), description: newDesc.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created');
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
    },
    onError: () => toast.error('Failed to create collection'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete collection'),
  });

  if (isLoading) {
    return <Loader variant="page" label="Loading collections…" />;
  }

  if (error) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Could not load collections.</p>
      </div>
    );
  }

  const list = collections ?? [];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">Group recipes into custom collections.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary w-full sm:w-auto">
          New collection
        </button>
      </div>

      {createOpen && (
        <div className="card-section max-w-md mb-6">
          <h2 className="font-display text-lg font-semibold text-content">Create collection</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="col-name" className="block text-sm font-medium text-content-muted mb-1">Name</label>
              <input
                id="col-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Weeknight Dinners"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="col-desc" className="block text-sm font-medium text-content-muted mb-1">Description (optional)</label>
              <textarea
                id="col-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="input-base"
                placeholder="Short description"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setCreateOpen(false); setNewName(''); setNewDesc(''); }} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => newName.trim() && createMutation.mutate()}
                disabled={!newName.trim() || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {list.length === 0 && !createOpen ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-12 text-center">
            <p className="text-content-muted font-medium">No collections yet.</p>
            <p className="mt-1 text-sm text-content-subtle">Create one to organize your recipes.</p>
            <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary mt-4">
              New collection
            </button>
          </div>
        ) : (
          list.map((c) => (
            <div key={c.id} className="card-interactive group relative overflow-hidden">
              <Link to={`/collections/${c.id}`} className="block p-4 sm:p-5">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-[var(--radius-card)] -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-4" aria-hidden />
                <h2 className="font-display font-semibold text-content group-hover:text-primary-600 transition-colors line-clamp-2 text-lg">
                  {c.name}
                </h2>
                {c.description && (
                  <p className="mt-1 text-sm text-content-muted line-clamp-2">{c.description}</p>
                )}
                <p className="mt-2 text-xs text-content-subtle">{c.recipeIds?.length ?? 0} recipes</p>
              </Link>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setDeleteId(c.id); }}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] shadow-sm transition hover:border-error hover:bg-error-muted hover:text-error focus:outline-none focus:ring-2 focus:ring-error/50"
                aria-label="Delete collection"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete collection?"
        message="Recipes in the collection will not be deleted; only the collection is removed."
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
