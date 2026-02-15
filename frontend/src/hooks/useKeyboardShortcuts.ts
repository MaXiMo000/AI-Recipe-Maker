import { useEffect } from 'react';

export type ShortcutHandler = (event: KeyboardEvent) => void;

export type ShortcutsMap = Record<string, ShortcutHandler>;

/**
 * Keyboard shortcuts with cross-platform support. Use 'Ctrl+Key' (works as Cmd on Mac).
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutsMap,
  dependencies: unknown[] = []
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target as HTMLElement)?.isContentEditable ||
        target?.getAttribute('role') === 'textbox';

      const allowedInInputs = ['Escape', 'Tab'];
      const isModKeyCombo = (event.ctrlKey || event.metaKey) && event.key.length === 1;
      const allowSearchShortcuts = isModKeyCombo && /^[fk]$/i.test(event.key);
      if (isInput && !allowedInInputs.includes(event.key) && !allowSearchShortcuts) {
        return;
      }

      const rawKey = event.key;
      const key = rawKey.length === 1 && rawKey >= 'a' && rawKey <= 'z'
        ? rawKey.toUpperCase()
        : rawKey;
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      let combination = '';
      if (isCtrlOrCmd) combination += 'Ctrl+';
      if (event.shiftKey) combination += 'Shift+';
      if (event.altKey) combination += 'Alt+';
      combination += key;

      const cb = shortcuts[combination];
      if (typeof cb === 'function') {
        cb(event);
        return;
      }
      if (isCtrlOrCmd && shortcuts[`Ctrl+${key}`]) {
        shortcuts[`Ctrl+${key}`](event);
        return;
      }
      if (event.shiftKey && shortcuts[`Shift+${key}`]) shortcuts[`Shift+${key}`](event);
      else if (event.altKey && shortcuts[`Alt+${key}`]) shortcuts[`Alt+${key}`](event);
      else if (!isCtrlOrCmd && !event.shiftKey && !event.altKey && shortcuts[key]) {
        shortcuts[key](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [shortcuts, ...dependencies]);
}

export const KeyboardShortcuts = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  CTRL_K: 'Ctrl+K',
  CTRL_S: 'Ctrl+S',
  CTRL_F: 'Ctrl+F',
  CTRL_P: 'Ctrl+P',
  CTRL_N: 'Ctrl+N',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;

export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
}

export function getModifierKeyName(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}
