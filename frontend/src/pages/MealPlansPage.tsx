import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';

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
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Failed to load meal plans.
      </div>
    );
  }

  const list = plans ?? [];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Meal plans</h1>
          <p className="mt-1 text-stone-600 text-sm sm:text-base">Plan your week and get a shopping list.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-primary-500 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-sm font-medium text-white hover:bg-primary-600 w-full sm:w-auto"
        >
          {showForm ? 'Cancel' : 'Create meal plan'}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <label className="block text-sm font-medium text-stone-700">Number of days (1–14)</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 7)}
              className="w-full sm:w-24 rounded border border-stone-300 px-3 py-2 min-h-[44px] sm:min-h-0"
            />
            <button
              type="button"
              onClick={() => generateMutation.mutate(days)}
              disabled={generateMutation.isPending}
              className="rounded-md bg-primary-500 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 w-full sm:w-auto"
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 ? (
          <p className="col-span-full text-stone-500">No meal plans yet. Create one above.</p>
        ) : (
          list.map((plan: any) => (
            <Link
              key={plan.id}
              to={`/meal-plans/${plan.id}`}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md"
            >
              <h2 className="font-medium text-stone-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {plan.startDate} – {plan.endDate}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
