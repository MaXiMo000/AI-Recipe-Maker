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
    <div className="mx-auto w-full max-w-md px-2 py-8 sm:py-12">
      <div className="card-section">
        <h1 className="page-title">Create account</h1>
        <p className="mt-1 text-sm text-content-subtle">
          Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-content-muted mb-1">Name (optional)</label>
            <input id="fullName" type="text" autoComplete="name" className="input-base" {...register('fullName')} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-content-muted mb-1">Email</label>
            <input id="email" type="email" autoComplete="email" className="input-base" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-content-muted mb-1">Password</label>
            <input id="password" type="password" autoComplete="new-password" className="input-base" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
