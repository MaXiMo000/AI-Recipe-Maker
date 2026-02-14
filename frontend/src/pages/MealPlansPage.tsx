import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';

export function MealPlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [days, setDays] = useState(7);

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any[] }>('/meal-plans');
      return data.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: (d: number) => api.post('/meal-plans/generate', { days: d }),
    onSuccess: (_, d) => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      toast.success(`${d}-day meal plan created`);
      setShowForm(false);
    },
    onError: () => toast.error('Failed to generate meal plan'),
  });

  if (isLoading) {
    return <Loader variant="page" label="Loading meal plans…" />;
  }

  if (error) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Failed to load meal plans.</p>
      </div>
    );
  }

  const list = plans ?? [];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Meal plans</h1>
          <p className="page-subtitle">Plan your week and get a shopping list.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary w-full sm:w-auto"
        >
          {showForm ? 'Cancel' : 'Create meal plan'}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 card-section max-w-md">
          <label className="block text-sm font-medium text-content-muted">Number of days (1–14)</label>
          <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 7)}
              className="input-base sm:w-24"
            />
            <button
              type="button"
              onClick={() => generateMutation.mutate(days)}
              disabled={generateMutation.isPending}
              className="btn-primary w-full sm:w-auto"
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 ? (
          <div className="col-span-full card-section text-center py-12">
            <p className="text-content-muted">No meal plans yet.</p>
            <p className="mt-1 text-sm text-content-subtle">Create one using the button above.</p>
          </div>
        ) : (
          list.map((plan: any) => (
            <Link
              key={plan.id}
              to={`/meal-plans/${plan.id}`}
              className="card-interactive group block"
            >
              <h2 className="font-semibold text-content group-hover:text-primary-600 transition-colors">
                {plan.name}
              </h2>
              <p className="mt-1.5 text-sm text-content-subtle">
                {plan.startDate} – {plan.endDate}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
