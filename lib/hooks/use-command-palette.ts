/**
 * useCommandPalette Hook
 * Global hook for command palette state and keyboard shortcuts
 */

import { useState, useCallback } from 'react';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keybindings are handled by the KeyboardShortcuts component

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

