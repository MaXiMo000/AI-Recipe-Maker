import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function GoogleAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      toast.error('Google sign-in failed. No token received.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    const finishAuth = async () => {
      try {
        localStorage.setItem('accessToken', token);
        await refreshUser();
        toast.success('Welcome!');
        navigate('/', { replace: true });
      } catch {
        toast.error('Failed to load your account.');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    finishAuth();
  }, [searchParams, navigate, refreshUser]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-stone-500">Signing you in…</p>
      </div>
    );
  }

  return null;
}
