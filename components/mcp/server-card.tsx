'use client';

/**
 * ServerCard Component
 * Displays an MCP server configuration in a card format
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerStatusBadge } from './server-status-badge';
import { ServerHealthIndicator } from './server-health-indicator';
import { ConnectionTypeIcon } from './connection-type-icon';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MCPServerConfig, ConnectionStatus } from '@/lib/types';
import type { ServerHealth } from '@/lib/services/health-monitor';
import { Play, Square, Trash2, Settings, FileCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('serverCard');
  const common = useTranslations('common');

  const getClientTypeLabel = (clientType: string): string => {
    const labels: Record<string, string> = {
      'claude-desktop': 'Claude Desktop',
      'vscode': 'VS Code',
      'cursor': 'Cursor',
      'windsurf': 'Windsurf',
      'zed': 'Zed',
      'cline': 'Cline',
      'continue': 'Continue',
      'mcp-hub': 'MCP Hub',
    };
    return labels[clientType] || clientType;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ConnectionTypeIcon type={server.transportType} className="h-5 w-5 flex-shrink-0" />
            <CardTitle className="text-lg truncate">{server.name}</CardTitle>
            {server.clientType && server.clientType !== 'mcp-hub' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      <FileCode className="h-3 w-3 mr-1" />
                      {getClientTypeLabel(server.clientType)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Imported from {getClientTypeLabel(server.clientType)}</p>
                    {server.configSourcePath && (
                      <p className="text-xs font-mono mt-1 max-w-xs truncate">
                        {server.configSourcePath}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{common('status.enabled')}</span>
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
                {t('actions.connect')}
              </Button>
            )}
            {isConnected && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDisconnect}
              >
                <Square className="h-4 w-4 mr-1" />
                {t('actions.disconnect')}
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

