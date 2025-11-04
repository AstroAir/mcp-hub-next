'use client';

import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { formatBinding } from '@/lib/utils/shortcuts';
import type { ShortcutAction } from '@/lib/types';
import { Keyboard, Undo2 } from 'lucide-react';

const LABELS: Record<ShortcutAction, string> = {
  'open-search': 'Open command palette',
  'open-settings': 'Open settings',
  'new': 'New (contextual)',
  'save': 'Save (contextual)',
  'navigate-dashboard': 'Navigate: Dashboard',
  'navigate-chat': 'Navigate: Chat',
  'navigate-settings': 'Navigate: Settings',
  'help': 'Show shortcuts help',
  'tab-next': 'Next tab/window',
  'tab-prev': 'Previous tab/window',
};

export function KeyboardShortcutsEditor() {
  const { shortcuts, setShortcut, resetSection } = useSettingsStore();
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [conflict, setConflict] = useState<{ action: ShortcutAction } | null>(null);

  const items = useMemo(() => {
    return (Object.keys(shortcuts) as ShortcutAction[])
      .map((id) => ({ id, label: LABELS[id], binding: shortcuts[id] }))
      .filter((it) =>
        it.label.toLowerCase().includes(filter.toLowerCase()) ||
        it.binding.toLowerCase().includes(filter.toLowerCase())
      );
  }, [shortcuts, filter]);

  const startCapture = (action: ShortcutAction) => {
    setEditing(action);
    setConflict(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();

  const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.metaKey) parts.push('Meta');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    parts.push(key);
    const token = parts.join('+');

    const result = setShortcut(editing, token);
    if (result && result.conflictWith) {
      setConflict({ action: result.conflictWith });
    } else {
      setEditing(null);
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-primary" />
          Keyboard Shortcuts
        </CardTitle>
        <CardDescription>View, customize, and reset keyboard shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Input
            placeholder="Search shortcuts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="md:max-w-sm"
          />
          <div className="flex items-center gap-2 justify-between">
            <Button variant="outline" onClick={() => resetSection('shortcuts')} className="gap-2">
              <Undo2 className="h-4 w-4" /> Reset All
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {editing === it.id ? (
                  <div
                    ref={captureRef}
                    className="px-2 py-1 rounded border bg-background text-xs font-mono"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                  >
                    Press new keys…
                  </div>
                ) : (
                  <Badge variant="secondary" className="font-mono text-xs break-keep">
                    {formatBinding(it.binding)}
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => startCapture(it.id)}>Change</Button>
                    </TooltipTrigger>
                    <TooltipContent>Click, then press the keys</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
          {conflict && (
            <div className="text-xs text-amber-600 dark:text-amber-400">Conflict with {conflict.action}. Saving anyway.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
