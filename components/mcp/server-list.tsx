'use client';

/**
 * ServerList Component
 * Displays a list of MCP servers
 */

import { ServerCard } from './server-card';
import type { MCPServerConfig, ConnectionStatus } from '@/lib/types';
import type { ServerHealth } from '@/lib/services/health-monitor';

interface ServerListProps {
  servers: MCPServerConfig[];
  getServerStatus: (serverId: string) => ConnectionStatus;
  getServerHealth?: (serverId: string) => ServerHealth | undefined;
  onConnect: (serverId: string) => void;
  onDisconnect: (serverId: string) => void;
  onDelete: (serverId: string) => void;
  onEdit: (server: MCPServerConfig) => void;
  onViewDetails: (serverId: string) => void;
  onReconnect?: (serverId: string) => void;
  onToggleEnabled?: (serverId: string, enabled: boolean) => void;
}

export function ServerList({
  servers,
  getServerStatus,
  getServerHealth,
  onConnect,
  onDisconnect,
  onDelete,
  onEdit,
  onViewDetails,
  onReconnect,
  onToggleEnabled,
}: ServerListProps) {
  if (servers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No servers configured yet</p>
        <p className="text-sm mt-2">Click &quot;Add Server&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
      {servers.map((server) => (
        <ServerCard
          key={server.id}
          server={server}
          status={getServerStatus(server.id)}
          health={getServerHealth?.(server.id)}
          onConnect={() => onConnect(server.id)}
          onDisconnect={() => onDisconnect(server.id)}
          onDelete={() => onDelete(server.id)}
          onEdit={() => onEdit(server)}
          onViewDetails={() => onViewDetails(server.id)}
          onReconnect={onReconnect ? () => onReconnect(server.id) : undefined}
          onToggleEnabled={onToggleEnabled ? (enabled) => onToggleEnabled(server.id, enabled) : undefined}
        />
      ))}
    </div>
  );
}

