import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { getMe } from '@/services/auth';
import { Loader } from '@/components/ui/Loader';

export function NutritionPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMe,
  });

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
  const calorieTarget = profile?.calorieTarget;
  const hasGoal = calorieTarget != null && calorieTarget > 0;
  const percentOfGoal = hasGoal && calories > 0 ? Math.round((calories / calorieTarget!) * 100) : null;

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">Nutrition</h1>
        <p className="page-subtitle">Daily summary from your meal plans.</p>
        {hasGoal && (
          <p className="mt-2 text-sm font-medium text-content-muted">
            Daily goal: <span className="text-primary-600">{calorieTarget} kcal</span>
            {percentOfGoal != null && summary?.source !== 'none' && (
              <span className="ml-2 text-content-subtle">— You’re at {percentOfGoal}% of goal</span>
            )}
          </p>
        )}
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
      ) : summary?.source === 'none' ? (
        <div className="mt-6 max-w-md rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/50 p-8 sm:p-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <p className="text-content-muted font-medium">No meal plan for this date</p>
          <p className="mt-1 text-sm text-content-subtle">Create a meal plan to see your daily nutrition summary.</p>
          <Link to="/meal-plans" className="btn-primary inline-flex mt-6">
            Create meal plan
          </Link>
        </div>
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
    </div>
  );
}
