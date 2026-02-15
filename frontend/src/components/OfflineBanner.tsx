import { useNetworkStatus } from '@/hooks';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      className="no-print sticky top-0 z-[100] bg-error py-2 text-center text-sm font-medium text-white"
      role="alert"
    >
      You’re offline. Some features may be unavailable.
    </div>
  );
}
