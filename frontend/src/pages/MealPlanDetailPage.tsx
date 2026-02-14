import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader } from '@/components/ui/Loader';

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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Link to="/meal-plans" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50 transition-colors">
        <span aria-hidden>←</span> Meal plans
      </Link>
      <div className="mt-4 card-section">
        <h1 className="page-title">{plan.name}</h1>
        <p className="page-subtitle">{plan.startDate} – {plan.endDate}</p>
      </div>

      <section className="mt-6 sm:mt-8">
        <h2 className="font-display text-lg font-semibold text-content mb-3">Meals by day</h2>
        <div className="space-y-4">
          {days.map((day: any, i: number) => (
            <div key={i} className="card-section">
              <h3 className="font-medium text-content">Day {day.day} {day.date && `(${day.date})`}</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {day.meals && Object.entries(day.meals).map(([slot, meal]: [string, any]) => (
                  <div key={slot} className="text-sm">
                    <span className="capitalize text-content-subtle">{slot}:</span>{' '}
                    {Array.isArray(meal) ? meal.map((m: any) => m?.title).filter(Boolean).join(', ') : meal?.title ?? '—'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 sm:mt-8">
        <h2 className="font-display text-lg font-semibold text-content mb-3">Shopping list</h2>
        <ul className="card-section space-y-2 list-none p-0">
          {list.length === 0 ? (
            <li className="text-content-subtle py-2">No items</li>
          ) : (
            list.map((item: any, i: number) => (
              <li key={i} className="py-1.5 border-b border-divider last:border-0 text-content-muted">
                {item.amount} {item.unit} {item.ingredient}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
