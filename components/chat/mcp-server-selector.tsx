"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServerStore, useConnectionStore, useChatStore } from '@/lib/stores';
import { Computer } from 'lucide-react';

export function MCPServerSelector() {
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();
  const { activeServerId, setActiveServer } = useChatStore();

  const connected = servers.filter((s) => connections[s.id]?.status === 'connected');

  return (
    <div className="flex items-center gap-2">
      <Computer className="h-4 w-4 text-muted-foreground" />
      <Select value={activeServerId ?? 'auto'} onValueChange={(v) => setActiveServer(v === 'auto' ? null : v)}>
        <SelectTrigger className="w-[180px] md:w-[220px] text-xs md:text-sm">
          <SelectValue placeholder="Server" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto (all connected)</SelectItem>
          {connected.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
