import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader } from '@/components/ui/Loader';

export function NutritionPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: summary, isLoading } = useQuery({
    queryKey: ['nutrition-daily', date],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any }>('/nutrition/daily-summary', {
        params: { date },
      });
      return data.data;
    },
  });

  const s = summary?.summary ?? {};
  const calories = s.calories ?? 0;
  const protein = s.protein ?? 0;
  const carbs = s.carbs ?? 0;
  const fat = s.fat ?? 0;

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">Nutrition</h1>
        <p className="page-subtitle">Daily summary from your meal plans.</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] p-4 sm:p-5 max-w-xs">
        <label className="block text-sm font-medium text-content-muted mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-base"
        />
      </div>

      {isLoading ? (
        <Loader variant="inline" label="Loading summary…" className="mt-6" />
      ) : (
        <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-amber-50/80 border border-amber-100 p-5 text-center shadow-sm">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Calories</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-1">{calories}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-5 text-center shadow-sm">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Protein (g)</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1">{protein}</p>
          </div>
          <div className="rounded-2xl bg-sky-50/80 border border-sky-100 p-5 text-center shadow-sm">
            <p className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Carbs (g)</p>
            <p className="text-2xl sm:text-3xl font-bold text-sky-900 mt-1">{carbs}</p>
          </div>
          <div className="rounded-2xl bg-rose-50/80 border border-rose-100 p-5 text-center shadow-sm">
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Fat (g)</p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-900 mt-1">{fat}</p>
          </div>
        </div>
      )}
      {summary?.source === 'none' && (
        <p className="mt-4 text-sm text-content-subtle">No meal plan for this date. Create a meal plan to see nutrition.</p>
      )}
    </div>
  );
}
