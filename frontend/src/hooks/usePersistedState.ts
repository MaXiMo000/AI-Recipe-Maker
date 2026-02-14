import { useState, useEffect } from 'react';

/**
 * useState that syncs with localStorage.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try {
          return JSON.parse(saved) as T;
        } catch {
          return saved as T;
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      if (state === null || state === undefined) {
        localStorage.removeItem(key);
      } else {
        const valueToStore = typeof state === 'string' ? state : JSON.stringify(state);
        localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

/** Persisted page number for pagination. */
export function usePersistedPage(
  key: string,
  initialValue = 1
): [number, React.Dispatch<React.SetStateAction<number>>] {
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const saved = parseInt(localStorage.getItem(key) ?? '', 10);
      return !Number.isNaN(saved) ? saved : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(page));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, page]);

  return [page, setPage];
}
