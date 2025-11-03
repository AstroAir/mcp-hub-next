/**
 * CommandPaletteProvider Component
 * Provides command palette globally with keyboard shortcut
 */

'use client';

import { useEffect } from 'react';
import { CommandPalette } from './command-palette';
import { useCommandPalette } from '@/lib/hooks/use-command-palette';
import { toast } from 'sonner';

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const { isOpen, close } = useCommandPalette();

  // Listen for command palette actions
  useEffect(() => {
    const handleAction = async (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string; serverId: string }>;
      const { action, serverId } = customEvent.detail;

      if (action === 'connect') {
        try {
          const response = await fetch('/api/mcp/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              config: { id: serverId } // This will be handled by the API
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast.success('Server connected');
          } else {
            toast.error(data.error || 'Failed to connect');
          }
        } catch (error) {
          toast.error('Failed to connect to server');
          console.error(error);
        }
      } else if (action === 'disconnect') {
        try {
          const response = await fetch('/api/mcp/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverId }),
          });

          const data = await response.json();
          if (data.success) {
            toast.success('Server disconnected');
          } else {
            toast.error(data.error || 'Failed to disconnect');
          }
        } catch (error) {
          toast.error('Failed to disconnect from server');
          console.error(error);
        }
      }
    };

    window.addEventListener('command-palette-action', handleAction);
    return () => window.removeEventListener('command-palette-action', handleAction);
  }, []);

  return (
    <>
      {children}
      <CommandPalette open={isOpen} onOpenChange={close} />
    </>
  );
}

