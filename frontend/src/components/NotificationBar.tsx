import { useEffect } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';

const typeStyles: Record<string, string> = {
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)] border-[var(--color-success)]',
  error: 'bg-error-muted text-error border-error',
  warning: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)] border-[var(--color-warning)]',
  info: 'bg-surface-100 text-content border-divider',
};

export function NotificationBar() {
  const { notification, hideNotification } = useNotificationContext();

  useEffect(() => {
    if (!notification.isOpen || !notification.autoClose) return;
    const t = setTimeout(hideNotification, 4000);
    return () => clearTimeout(t);
  }, [notification.isOpen, notification.autoClose, hideNotification]);

  if (!notification.isOpen) return null;

  const style = typeStyles[notification.type] ?? typeStyles.info;

  return (
    <div
      className={`sticky top-0 z-[99] border-b px-4 py-2 text-center text-sm ${style}`}
      role="status"
    >
      {notification.message}
      <button
        type="button"
        onClick={hideNotification}
        className="ml-2 underline focus:outline-none"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
