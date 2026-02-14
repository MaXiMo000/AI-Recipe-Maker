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
      <h1 className="page-title">Nutrition</h1>
      <p className="page-subtitle">Daily summary from your meal plans.</p>

      <div className="mt-6 card-section max-w-xs">
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
          <div className="card-section text-center py-5">
            <p className="text-sm font-medium text-content-subtle uppercase tracking-wider">Calories</p>
            <p className="text-2xl sm:text-3xl font-semibold text-content mt-1">{calories}</p>
          </div>
          <div className="card-section text-center py-5">
            <p className="text-sm font-medium text-content-subtle uppercase tracking-wider">Protein (g)</p>
            <p className="text-2xl sm:text-3xl font-semibold text-content mt-1">{protein}</p>
          </div>
          <div className="card-section text-center py-5">
            <p className="text-sm font-medium text-content-subtle uppercase tracking-wider">Carbs (g)</p>
            <p className="text-2xl sm:text-3xl font-semibold text-content mt-1">{carbs}</p>
          </div>
          <div className="card-section text-center py-5">
            <p className="text-sm font-medium text-content-subtle uppercase tracking-wider">Fat (g)</p>
            <p className="text-2xl sm:text-3xl font-semibold text-content mt-1">{fat}</p>
          </div>
        </div>
      )}
      {summary?.source === 'none' && (
        <p className="mt-4 text-sm text-content-subtle">No meal plan for this date. Create a meal plan to see nutrition.</p>
      )}
    </div>
  );
}
