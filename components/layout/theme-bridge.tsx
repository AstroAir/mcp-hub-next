'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/lib/stores/settings-store';

/**
 * Syncs the settings store theme/font with next-themes and document root.
 */
export function ThemeBridge() {
  const { appearance } = useSettingsStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(appearance.theme);
  }, [appearance.theme, setTheme]);

  useEffect(() => {
    // Font scale via root font-size
    const root = document.documentElement;
    const size = appearance.fontScale === 'sm' ? '14px' : appearance.fontScale === 'lg' ? '18px' : '16px';
    root.style.fontSize = size;

    // Color scheme as a body class (future CSS can hook into it)
    const cls = `theme-${appearance.colorScheme}`;
    // Convert to array to avoid issues with modifying during iteration
    const classesToRemove = Array.from(document.body.classList).filter((c) => c.startsWith('theme-'));
    classesToRemove.forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(cls);
  }, [appearance.fontScale, appearance.colorScheme]);

  return null;
}
