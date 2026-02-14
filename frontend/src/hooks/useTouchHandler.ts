import { useCallback, useRef } from 'react';
import { useResponsive } from './useResponsive';

interface TouchCoords {
  x: number;
  y: number;
  time: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeEventHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

interface TapHandlers {
  onClick: (e: React.MouseEvent) => void;
}

export function useTouchHandler() {
  const { isTouchDevice, isMobile } = useResponsive();
  const touchStartRef = useRef<TouchCoords | null>(null);
  const touchEndRef = useRef<TouchCoords | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSwipe = useCallback(
    (handlers: SwipeHandlers): SwipeEventHandlers => {
      const minSwipeDistance = 50;
      const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = handlers;

      return {
        onTouchStart: (e: React.TouchEvent) => {
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now(),
          };
        },
        onTouchEnd: (e: React.TouchEvent) => {
          if (!touchStartRef.current) return;
          touchEndRef.current = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now(),
          };

          const deltaX = touchEndRef.current.x - touchStartRef.current.x;
          const deltaY = touchEndRef.current.y - touchStartRef.current.y;
          const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

          if (deltaTime > 500) return;

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
              if (deltaX > 0) onSwipeRight?.();
              else onSwipeLeft?.();
            }
          } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
              if (deltaY > 0) onSwipeDown?.();
              else onSwipeUp?.();
            }
          }

          touchStartRef.current = null;
          touchEndRef.current = null;
        },
      };
    },
    []
  );

  const handleLongPress = useCallback(
    (onLongPress: (e: React.TouchEvent) => void, delay = 500): LongPressHandlers => {
      return {
        onTouchStart: (e: React.TouchEvent) => {
          longPressTimeoutRef.current = setTimeout(() => {
            onLongPress(e);
          }, delay);
        },
        onTouchEnd: () => {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        },
        onTouchMove: () => {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        },
      };
    },
    []
  );

  const handleTap = useCallback(
    (
      onClick: (e: React.MouseEvent) => void,
      onDoubleClick?: (e: React.MouseEvent) => void
    ): TapHandlers => {
      let lastTap = 0;
      return {
        onClick: (e: React.MouseEvent) => {
          const currentTime = Date.now();
          const tapLength = currentTime - lastTap;
          if (tapLength < 500 && tapLength > 0) {
            onDoubleClick?.(e);
          } else {
            onClick(e);
          }
          lastTap = currentTime;
        },
      };
    },
    []
  );

  const vibrate = useCallback((pattern: number | number[] = [10]) => {
    if (isTouchDevice && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [isTouchDevice]);

  return {
    isTouchDevice,
    isMobile,
    handleSwipe,
    handleLongPress,
    handleTap,
    vibrate,
  };
}
