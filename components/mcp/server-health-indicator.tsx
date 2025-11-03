/**
 * ServerHealthIndicator Component
 * Displays server health status with visual indicators
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import type { ServerHealth } from '@/lib/services/health-monitor';

interface ServerHealthIndicatorProps {
  health?: ServerHealth;
  onReconnect?: () => void;
  showDetails?: boolean;
}

export function ServerHealthIndicator({
  health,
  onReconnect,
  showDetails = false,
}: ServerHealthIndicatorProps) {
  if (!health) {
    return null;
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div className="font-semibold capitalize">{health.status}</div>
              {health.status !== 'offline' && (
                <>
                  <div>Uptime: {formatUptime(health.uptime)}</div>
                  <div>Response: {formatResponseTime(health.responseTime)}</div>
                </>
              )}
              {health.status === 'offline' && health.lastError && (
                <div className="text-red-500">Error: {health.lastError}</div>
              )}
              {health.failureCount > 0 && (
                <div className="text-yellow-500">Failures: {health.failureCount}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
            {health.status}
          </Badge>
        </div>
        {health.status === 'offline' && onReconnect && (
          <Button variant="outline" size="sm" onClick={onReconnect}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {health.status !== 'offline' && (
          <>
            <div>
              <div className="text-muted-foreground">Uptime</div>
              <div className="font-medium">{formatUptime(health.uptime)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Response Time</div>
              <div className="font-medium">{formatResponseTime(health.responseTime)}</div>
            </div>
          </>
        )}
        <div>
          <div className="text-muted-foreground">Last Check</div>
          <div className="font-medium">
            {new Date(health.lastCheck).toLocaleTimeString()}
          </div>
        </div>
        {health.failureCount > 0 && (
          <div>
            <div className="text-muted-foreground">Failures</div>
            <div className="font-medium text-yellow-500">{health.failureCount}</div>
          </div>
        )}
      </div>

      {health.lastError && (
        <div className="text-xs text-red-500 p-2 bg-red-50 dark:bg-red-950 rounded">
          <div className="font-semibold">Last Error:</div>
          <div>{health.lastError}</div>
        </div>
      )}
    </div>
  );
}

