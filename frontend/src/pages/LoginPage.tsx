import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const apiOrigin = import.meta.env.VITE_API_URL || '';
const backendApiBase = apiOrigin ? `${apiOrigin.replace(/\/+$/, '')}/api` : `${window.location.origin}/api`;
const googleAuthUrl = `${backendApiBase}/auth/google`;

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error === 'google_not_configured') toast.error('Google sign-in is not configured.');
    if (error === 'google_auth_failed') toast.error('Google sign-in failed. Please try again.');
  }, [location.search]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Login failed';
      toast.error(msg as string || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm px-2 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Log in</h1>
      <p className="mt-1 text-sm text-stone-500">
        Don’t have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
            autoComplete="current-password"
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
          {submitting ? 'Signing in…' : 'Log in'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-stone-500">Or continue with</span>
          </div>
        </div>

        <a
          href={googleAuthUrl}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white py-2.5 sm:py-2 font-medium text-stone-700 hover:bg-stone-50 min-h-[44px] sm:min-h-0"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </a>
      </form>
    </div>
  );
}
