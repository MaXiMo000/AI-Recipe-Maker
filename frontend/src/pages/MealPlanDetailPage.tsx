import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate, formatDateRange } from '@/utils/format';

export function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['meal-plan', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any }>(`/meal-plans/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const { data: shoppingList } = useQuery({
    queryKey: ['meal-plan-shopping', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any[] }>(`/meal-plans/${id}/shopping-list`);
      return data.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/meal-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      toast.success('Meal plan deleted');
      navigate('/meal-plans');
    },
    onError: () => toast.error('Failed to delete meal plan'),
  });

  if (isLoading || !id) {
    return <Loader variant="page" label="Loading meal plan…" />;
  }

  if (error || !plan) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Meal plan not found.</p>
        <Link to="/meal-plans" className="mt-2 inline-block text-primary-600 hover:underline font-medium">← Back to meal plans</Link>
      </div>
    );
  }

  const days = Array.isArray(plan.meals) ? plan.meals : [];
  const list = Array.isArray(shoppingList) ? shoppingList : [];

  const handleCopyShoppingList = async () => {
    try {
      const { data } = await api.get<string>(`/meal-plans/${id}/shopping-list`, {
        params: { format: 'text' },
        responseType: 'text',
      });
      await navigator.clipboard.writeText(data);
      toast.success('Shopping list copied to clipboard');
    } catch {
      toast.error('Failed to copy list');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/meal-plans" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50 transition-colors">
          <span aria-hidden>←</span> Meal plans
        </Link>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="btn-danger text-sm py-2 min-h-[40px]"
        >
          Delete plan
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete meal plan?"
        message="This cannot be undone. The plan and its shopping list will be removed."
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />

      <header className="mt-4 rounded-2xl bg-gradient-to-br from-primary-50 via-white to-orange-50/50 border border-primary-100/80 p-5 sm:p-6 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-content tracking-tight">
          {plan.name}
        </h1>
        <p className="mt-2 text-content-muted">
          {formatDateRange(plan.startDate, plan.endDate)}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="section-heading">Meals by day</h2>
        <div className="space-y-4">
          {days.map((day: any, i: number) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
              <div className="px-4 py-3 sm:px-5 bg-primary-50/50 border-b border-primary-100/50">
                <h3 className="font-display font-semibold text-content">
                  Day {day.day}
                  {day.date && (
                    <span className="ml-2 font-normal text-content-muted">
                      {formatDate(day.date)}
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-4 sm:p-5 grid gap-3 sm:grid-cols-3">
                {day.meals && Object.entries(day.meals).map(([slot, meal]: [string, any]) => (
                  <div key={slot} className="rounded-xl bg-[var(--color-surface)]/50 p-3">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider capitalize">{slot}</span>
                    <p className="mt-1 text-sm text-content">
                      {Array.isArray(meal) ? meal.map((m: any) => m?.title).filter(Boolean).join(', ') : meal?.title ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b-2 border-primary-100">
          <h2 className="section-heading mb-0 pb-0 border-0">Shopping list</h2>
          {list.length > 0 && (
            <button
              type="button"
              onClick={handleCopyShoppingList}
              className="btn-secondary text-sm py-2 min-h-[40px]"
            >
              Copy list
            </button>
          )}
        </div>
        <ul className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)] overflow-hidden">
          {list.length === 0 ? (
            <li className="px-4 py-6 text-center text-content-subtle">No items</li>
          ) : (
            list.map((item: any, i: number) => (
              <li key={i} className="px-4 py-3 sm:px-5 flex items-center gap-3 hover:bg-primary-50/30 transition-colors">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                  {i + 1}
                </span>
                <span className="text-content">
                  {item.amount} {item.unit} {(item.ingredient ?? '').replace(/\|+$/, '').trim()}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
