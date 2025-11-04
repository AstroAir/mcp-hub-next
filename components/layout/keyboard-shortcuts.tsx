'use client';

/**
 * KeyboardShortcuts Component
 * Global keyboard shortcuts handler
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { eventToToken, matchToken } from '@/lib/utils/shortcuts';
import { useCommandPalette } from '@/lib/hooks/use-command-palette';

export function KeyboardShortcuts() {
  const router = useRouter();
  const { openServerForm } = useUIStore();
  const { shortcuts } = useSettingsStore();
  const { open: openPalette } = useCommandPalette();
  const sequenceRef = useRef<{ first?: string; timeout?: number }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const token = eventToToken(e);

      // Sequence handling for 'G D' style
      const isG = e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (isG) {
        sequenceRef.current.first = 'G';
        window.clearTimeout(sequenceRef.current.timeout);
        sequenceRef.current.timeout = window.setTimeout(() => {
          sequenceRef.current.first = undefined;
        }, 1000);
        return;
      }

      if (sequenceRef.current.first === 'G') {
        const second = e.key.toUpperCase();
        const seq = `G ${second}`;
        if (matchToken(shortcuts['navigate-dashboard'], seq)) {
          e.preventDefault();
          router.push('/');
          sequenceRef.current.first = undefined;
          return;
        }
        if (matchToken(shortcuts['navigate-chat'], seq)) {
          e.preventDefault();
          router.push('/chat');
          sequenceRef.current.first = undefined;
          return;
        }
        if (matchToken(shortcuts['navigate-settings'], seq)) {
          e.preventDefault();
          router.push('/settings');
          sequenceRef.current.first = undefined;
          return;
        }
      }

      // Single-key combos
      if (matchToken(shortcuts['open-search'], token)) {
        e.preventDefault();
        openPalette();
        return;
      }
      if (matchToken(shortcuts['open-settings'], token)) {
        e.preventDefault();
        router.push('/settings');
        return;
      }
      if (matchToken(shortcuts['new'], token)) {
        e.preventDefault();
        openServerForm();
        return;
      }
      if (matchToken(shortcuts['save'], token)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('global-save'));
        return;
      }
      if (matchToken(shortcuts['help'], token)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));
        return;
      }
      if (matchToken(shortcuts['tab-next'], token)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('global-tab-next'));
        return;
      }
      if (matchToken(shortcuts['tab-prev'], token)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('global-tab-prev'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, openServerForm, shortcuts, openPalette]);

  return null;
}

