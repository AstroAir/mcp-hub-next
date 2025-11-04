'use client';

/**
 * ServerCard Component
 * Displays an MCP server configuration in a card format
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServerStatusBadge } from './server-status-badge';
import { ServerHealthIndicator } from './server-health-indicator';
import { ConnectionTypeIcon } from './connection-type-icon';
import { Switch } from '@/components/ui/switch';
import type { MCPServerConfig, ConnectionStatus } from '@/lib/types';
import type { ServerHealth } from '@/lib/services/health-monitor';
import { Play, Square, Trash2, Settings } from 'lucide-react';

interface ServerCardProps {
  server: MCPServerConfig;
  status?: ConnectionStatus;
  health?: ServerHealth;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onReconnect?: () => void;
  onToggleEnabled?: (enabled: boolean) => void;
}

export function ServerCard({
  server,
  status = 'disconnected',
  health,
  onConnect,
  onDisconnect,
  onDelete,
  onEdit,
  onViewDetails,
  onReconnect,
  onToggleEnabled,
}: ServerCardProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'reconnecting';

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ConnectionTypeIcon type={server.transportType} className="h-5 w-5" />
            <CardTitle className="text-lg">{server.name}</CardTitle>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Enabled</span>
              <Switch
                checked={server.enabled !== false}
                onCheckedChange={(val) => onToggleEnabled?.(val)}
              />
            </div>
            <ServerStatusBadge status={status} />
          </div>
        </div>
        {server.description && (
          <CardDescription className="mt-2">{server.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {/* Health indicator for connected servers */}
          {isConnected && health && (
            <div onClick={(e) => e.stopPropagation()}>
              <ServerHealthIndicator
                health={health}
                onReconnect={onReconnect}
              />
            </div>
          )}

          {/* Transport-specific info */}
          <div className="text-sm text-muted-foreground">
            {server.transportType === 'stdio' && (
              <div className="font-mono text-xs bg-muted p-2 rounded">
                {server.command} {server.args?.join(' ')}
              </div>
            )}
            {server.transportType === 'sse' && (
              <div className="font-mono text-xs bg-muted p-2 rounded truncate">
                {server.url}
              </div>
            )}
            {server.transportType === 'http' && (
              <div className="font-mono text-xs bg-muted p-2 rounded truncate">
                {server.url}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {!isConnected && !isConnecting && (
              <Button
                size="sm"
                variant="default"
                onClick={onConnect}
                disabled={isConnecting || server.enabled === false}
              >
                <Play className="h-4 w-4 mr-1" />
                Connect
              </Button>
            )}
            {isConnected && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDisconnect}
              >
                <Square className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

