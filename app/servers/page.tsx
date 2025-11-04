'use client';

/**
 * MCP Servers Management Dashboard
 * Centralized view that aggregates connection and process status via the unified MCP API.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerList } from '@/components/mcp/server-list';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { useServerStore } from '@/lib/stores';
import type { ConnectionStatus, MCPConnectionState, MCPServerConfig, MCPServerProcess } from '@/lib/types';
import type { UnifiedMCPStatus } from '@/lib/types/api';
import { RefreshCw, Power, PowerOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

type UnifiedConnections = Record<string, MCPConnectionState | undefined>;

export default function ServersManagementPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers, updateServer, removeServer } = useServerStore();

  const [status, setStatus] = useState<UnifiedMCPStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: 'Servers' }]);
  }, [setBreadcrumbs]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mcp', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setStatus(json.data as UnifiedMCPStatus);
      } else {
        toast.error(json.error || 'Failed to load MCP status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load MCP status');
    } finally {
      setLoading(false);
    }
  };

  // Initial load + periodic refresh
  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => clearInterval(id);
  }, []);

  const connections: UnifiedConnections = useMemo(() => {
    const map: UnifiedConnections = {};
    if (!status) return map;
    for (const [id, conn] of Object.entries(status.connections || {})) {
      map[id] = conn as MCPConnectionState;
    }
    return map;
  }, [status]);

  const processes: Record<string, MCPServerProcess> = useMemo(() => {
    return (status?.processes as Record<string, MCPServerProcess>) || {};
  }, [status]);

  const getServerStatus = (serverId: string): ConnectionStatus => {
    const s = connections[serverId];
    return s?.status || 'disconnected';
  };

  const handleConnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', config: server }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Connected');
        fetchStatus();
      } else {
        toast.error(json.error || 'Failed to connect');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect');
    }
  };

  const handleDisconnect = async (serverId: string) => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', serverId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Disconnected');
        fetchStatus();
      } else {
        toast.error(json.error || 'Failed to disconnect');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to disconnect');
    }
  };

  const handleToggleEnabled = (serverId: string, enabled: boolean) => {
    updateServer(serverId, { enabled });
  };

  const handleBulkConnect = async () => {
    const targets = servers.filter((s) => s.enabled !== false);
    let ok = 0;
    for (const srv of targets) {
      try {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'connect', config: srv }),
        });
        const json = await res.json();
        if (json.success) ok++;
      } catch {}
    }
    toast.success(`Connected ${ok}/${targets.length}`);
    fetchStatus();
  };

  const handleBulkDisconnect = async () => {
    const ids = Object.keys(connections);
    let ok = 0;
    for (const id of ids) {
      try {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect', serverId: id }),
        });
        const json = await res.json();
        if (json.success) ok++;
      } catch {}
    }
    toast.success(`Disconnected ${ok}/${ids.length}`);
    fetchStatus();
  };

  const handleEnableAll = () => {
    servers.forEach((s) => updateServer(s.id, { enabled: true }));
    toast.success('All servers enabled');
  };

  const handleDisableAll = () => {
    servers.forEach((s) => updateServer(s.id, { enabled: false }));
    toast.success('All servers disabled');
  };

  const runningCount = useMemo(() => Object.values(processes).filter(p => p.state === 'running').length, [processes]);
  const connectedCount = useMemo(() => Object.values(connections).filter(c => c?.status === 'connected').length, [connections]);

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Servers Management</h1>
          <p className="text-muted-foreground mt-1">Unified status across transports</p>
          <p className="text-xs text-muted-foreground mt-1">
            {connectedCount} connected • {runningCount} running processes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleEnableAll}>
            <ToggleRight className="h-4 w-4 mr-2" /> Enable all
          </Button>
          <Button variant="outline" onClick={handleDisableAll}>
            <ToggleLeft className="h-4 w-4 mr-2" /> Disable all
          </Button>
          <Button variant="outline" onClick={handleBulkConnect}>
            <Power className="h-4 w-4 mr-2" /> Connect enabled
          </Button>
          <Button variant="outline" onClick={handleBulkDisconnect}>
            <PowerOff className="h-4 w-4 mr-2" /> Disconnect all
          </Button>
        </div>
      </div>

      {/* Servers list using unified status */}
      <ServerList
        servers={servers}
        getServerStatus={getServerStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onDelete={(id) => removeServer(id)}
        onEdit={(server: MCPServerConfig) => router.push(`/servers/${server.id}`)}
        onViewDetails={(id) => router.push(`/servers/${id}`)}
        onToggleEnabled={handleToggleEnabled}
      />

      {/* Processes panel */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Running Processes</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(processes).length === 0 ? (
              <p className="text-sm text-muted-foreground">No stdio processes running</p>
            ) : (
              <div className="space-y-3">
                {Object.values(processes).map((p) => (
                  <div key={p.serverId} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="font-medium">{servers.find(s => s.id === p.serverId)?.name || p.serverId}</div>
                      <div className="text-xs text-muted-foreground">PID {p.pid ?? '—'} • {p.state} • restarted {p.restartCount}x</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.uptime ? `${p.uptime}s` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
