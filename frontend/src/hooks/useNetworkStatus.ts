import { useState, useEffect } from 'react';

type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

interface NetworkState {
  isOnline: boolean;
  connectionType: EffectiveConnectionType | string;
  isSlowConnection: boolean;
  isFastConnection: boolean;
}

declare global {
  interface Navigator {
    connection?: {
      effectiveType?: EffectiveConnectionType;
      addEventListener(type: 'change', listener: () => void): void;
      removeEventListener(type: 'change', listener: () => void): void;
    };
  }
}

export function useNetworkStatus(): NetworkState {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<EffectiveConnectionType | string>(
    typeof navigator !== 'undefined' && navigator.connection?.effectiveType
      ? navigator.connection.effectiveType
      : 'unknown'
  );

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Connection restored', {
          body: 'Your internet connection has been restored.',
          tag: 'network-status',
        });
      }
    };

    const handleOffline = (): void => {
      setIsOnline(false);
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Connection lost', {
          body: 'You are offline. Some features may not be available.',
          tag: 'network-status',
        });
      }
    };

    const handleConnectionChange = (): void => {
      if (navigator.connection?.effectiveType) {
        setConnectionType(navigator.connection.effectiveType);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    isFastConnection: connectionType === '4g' || connectionType === '5g',
  };
}
