import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success('Account created!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Registration failed';
      toast.error(msg as string || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm px-2 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Create account</h1>
      <p className="mt-1 text-sm text-stone-500">
        Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-stone-700">Name (optional)</label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('fullName')}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary-500 py-2.5 sm:py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50 min-h-[44px] sm:min-h-0"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}
