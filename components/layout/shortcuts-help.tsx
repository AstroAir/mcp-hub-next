'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { formatBinding } from '@/lib/utils/shortcuts';

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const { shortcuts } = useSettingsStore();

  useEffect(() => {
    const toggle = () => setOpen((p) => !p);
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('shortcuts-help:toggle', toggle);
    window.addEventListener('shortcuts-help:open', openHandler);
    window.addEventListener('shortcuts-help:close', closeHandler);
    return () => {
      window.removeEventListener('shortcuts-help:toggle', toggle);
      window.removeEventListener('shortcuts-help:open', openHandler);
      window.removeEventListener('shortcuts-help:close', closeHandler);
    };
  }, []);

  const entries = useMemo(() => Object.entries(shortcuts), [shortcuts]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-xl">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
        </div>
        <ScrollArea className="max-h-[420px]">
          <div className="p-3 grid gap-2">
            {entries.map(([id, binding]) => (
              <div key={id} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                <div className="text-sm font-medium">{id}</div>
                <Badge variant="secondary" className="font-mono text-xs">{formatBinding(binding)}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
          Tip: Press Shift+? or Ctrl/Cmd+/ to toggle this panel
        </div>
      </DialogContent>
    </Dialog>
  );
}
