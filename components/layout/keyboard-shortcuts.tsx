'use client';

/**
 * KeyboardShortcuts Component
 * Global keyboard shortcuts handler
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores';

export function KeyboardShortcuts() {
  const router = useRouter();
  const { openServerForm } = useUIStore();

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

      // Cmd/Ctrl + K: Open command palette (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Open command palette
        return;
      }

      // Cmd/Ctrl + N: New server
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openServerForm();
        return;
      }

      // G then D: Go to dashboard
      if (e.key === 'g') {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === 'd') {
            router.push('/');
          } else if (e2.key === 'c') {
            router.push('/chat');
          } else if (e2.key === 's') {
            router.push('/settings');
          }
          window.removeEventListener('keydown', handleSecondKey);
        };
        window.addEventListener('keydown', handleSecondKey);
        setTimeout(() => {
          window.removeEventListener('keydown', handleSecondKey);
        }, 1000);
        return;
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        // Handled by dialog components
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, openServerForm]);

  return null;
}

