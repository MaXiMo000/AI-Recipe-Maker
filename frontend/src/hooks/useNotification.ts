import { useState, useCallback } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationState {
  isOpen: boolean;
  message: string;
  type: NotificationType;
  autoClose: boolean;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    message: '',
    type: 'info',
    autoClose: true,
  });

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', autoClose = true) => {
      setNotification({ isOpen: true, message, type, autoClose });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(
    (message: string, autoClose = true) => {
      showNotification(message, 'success', autoClose);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, autoClose = true) => {
      showNotification(message, 'error', autoClose);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, autoClose = true) => {
      showNotification(message, 'warning', autoClose);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, autoClose = true) => {
      showNotification(message, 'info', autoClose);
    },
    [showNotification]
  );

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
