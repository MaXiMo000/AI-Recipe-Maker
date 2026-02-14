import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';

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
    return <Loader variant="page" label="Signing you in…" />;
  }

  return null;
}
