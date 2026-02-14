import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { getMe, updateProfile } from '@/services/auth';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';

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
  const { showSuccess } = useNotificationContext();
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
      showSuccess('Profile saved');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (isLoading || !user) {
    return <Loader variant="page" label="Loading profile…" />;
  }

  return (
    <div className="mx-auto w-full max-w-lg px-2">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">{user.email}</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-6 sm:mt-8 card-section space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-content-muted mb-1">Name</label>
          <input id="fullName" type="text" className="input-base" {...register('fullName')} />
        </div>
        <div>
          <label htmlFor="skillLevel" className="block text-sm font-medium text-content-muted mb-1">Skill level</label>
          <select id="skillLevel" className="input-base" {...register('skillLevel')}>
            <option value="">—</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="calorieTarget" className="block text-sm font-medium text-content-muted mb-1">Calorie target (daily)</label>
          <input id="calorieTarget" type="number" className="input-base" {...register('calorieTarget', { valueAsNumber: true })} />
        </div>
        <div>
          <label htmlFor="dietaryPreferences" className="block text-sm font-medium text-content-muted mb-1">Dietary (comma-separated)</label>
          <input id="dietaryPreferences" type="text" placeholder="e.g. vegetarian, gluten-free" className="input-base" {...register('dietaryPreferences')} />
        </div>
        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-content-muted mb-1">Allergies (comma-separated)</label>
          <input id="allergies" type="text" placeholder="e.g. nuts, shellfish" className="input-base" {...register('allergies')} />
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full sm:w-auto">
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
