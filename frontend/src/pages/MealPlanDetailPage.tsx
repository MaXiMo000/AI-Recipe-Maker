import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();

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

  if (isLoading || !id) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Meal plan not found. <Link to="/meal-plans" className="underline">Back to meal plans</Link>
      </div>
    );
  }

  const days = Array.isArray(plan.meals) ? plan.meals : [];
  const list = Array.isArray(shoppingList) ? shoppingList : [];

  return (
    <div className="w-full max-w-4xl">
      <Link to="/meal-plans" className="text-sm text-primary-600 hover:underline">← Meal plans</Link>
      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-stone-900 break-words">{plan.name}</h1>
      <p className="text-stone-600">{plan.startDate} – {plan.endDate}</p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium text-stone-900">Meals by day</h2>
        <div className="mt-4 space-y-6">
          {days.map((day: any, i: number) => (
            <div key={i} className="rounded-lg border border-stone-200 bg-white p-4">
              <h3 className="font-medium text-stone-800">Day {day.day} {day.date && `(${day.date})`}</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {day.meals && Object.entries(day.meals).map(([slot, meal]: [string, any]) => (
                  <div key={slot} className="text-sm">
                    <span className="capitalize text-stone-500">{slot}:</span>{' '}
                    {Array.isArray(meal) ? meal.map((m: any) => m?.title).filter(Boolean).join(', ') : meal?.title ?? '—'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium text-stone-900">Shopping list</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700">
          {list.length === 0 ? (
            <li className="text-stone-500">No items</li>
          ) : (
            list.map((item: any, i: number) => (
              <li key={i}>
                {item.amount} {item.unit} {item.ingredient}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
