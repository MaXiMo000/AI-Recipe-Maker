import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getMe, updateProfile } from '@/services/auth';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  calorieTarget: z.number().optional(),
  dietaryPreferences: z.string().optional(),
  allergies: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getMe,
    enabled: !!authUser,
  });

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user
      ? {
          fullName: user.fullName ?? '',
          skillLevel: (user.skillLevel as FormData['skillLevel']) ?? undefined,
          calorieTarget: user.calorieTarget ?? undefined,
          dietaryPreferences: user.dietaryPreferences?.join(', ') ?? '',
          allergies: user.allergies?.join(', ') ?? '',
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateProfile({
        fullName: data.fullName || undefined,
        skillLevel: data.skillLevel,
        calorieTarget: data.calorieTarget,
        dietaryPreferences: data.dietaryPreferences
          ? data.dietaryPreferences.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        allergies: data.allergies ? data.allergies.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshUser();
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-2">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Profile</h1>
      <p className="mt-1 text-stone-600 text-sm sm:text-base">{user.email}</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-stone-700">Name</label>
          <input
            id="fullName"
            type="text"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('fullName')}
          />
        </div>
        <div>
          <label htmlFor="skillLevel" className="block text-sm font-medium text-stone-700">Skill level</label>
          <select
            id="skillLevel"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('skillLevel')}
          >
            <option value="">—</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="calorieTarget" className="block text-sm font-medium text-stone-700">Calorie target (daily)</label>
          <input
            id="calorieTarget"
            type="number"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('calorieTarget', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="dietaryPreferences" className="block text-sm font-medium text-stone-700">Dietary (comma-separated)</label>
          <input
            id="dietaryPreferences"
            type="text"
            placeholder="e.g. vegetarian, gluten-free"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('dietaryPreferences')}
          />
        </div>
        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-stone-700">Allergies (comma-separated)</label>
          <input
            id="allergies"
            type="text"
            placeholder="e.g. nuts, shellfish"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('allergies')}
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full sm:w-auto rounded-md bg-primary-500 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
