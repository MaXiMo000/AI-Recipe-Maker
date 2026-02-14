import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

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
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Nutrition</h1>
      <p className="mt-1 text-stone-600 text-sm sm:text-base">Daily summary from your meal plans.</p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        />
      </div>

      {isLoading ? (
        <div className="mt-6 h-24 animate-pulse rounded-lg bg-stone-200" />
      ) : (
        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Calories</p>
            <p className="text-2xl font-semibold text-stone-900">{calories}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Protein (g)</p>
            <p className="text-2xl font-semibold text-stone-900">{protein}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Carbs (g)</p>
            <p className="text-2xl font-semibold text-stone-900">{carbs}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Fat (g)</p>
            <p className="text-2xl font-semibold text-stone-900">{fat}</p>
          </div>
        </div>
      )}
      {summary?.source === 'none' && (
        <p className="mt-4 text-sm text-stone-500">No meal plan for this date. Create a meal plan to see nutrition.</p>
      )}
    </div>
  );
}
