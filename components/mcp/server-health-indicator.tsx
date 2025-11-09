/**
 * ServerHealthIndicator Component
 * Displays server health status with visual indicators
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('components.serverHealth');

  if (!health) {
    return null;
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle aria-hidden className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <Activity aria-hidden className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <AlertCircle aria-hidden className="h-4 w-4 text-red-500" />;
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

    if (days > 0) {
      return t('format.uptime.days', { days: String(days), hours: String(hours % 24) });
    }
    if (hours > 0) {
      return t('format.uptime.hours', { hours: String(hours), minutes: String(minutes % 60) });
    }
    if (minutes > 0) {
      return t('format.uptime.minutes', { minutes: String(minutes), seconds: String(seconds % 60) });
    }
    return t('format.uptime.seconds', { seconds: String(seconds) });
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) {
      return t('format.response.milliseconds', { value: String(ms) });
    }
    return t('format.response.seconds', { value: (ms / 1000).toFixed(2) });
  };

  const getStatusLabel = () => {
    switch (health.status) {
      case 'healthy':
        return t('status.healthy');
      case 'degraded':
        return t('status.degraded');
      case 'offline':
        return t('status.offline');
      default:
        return health.status;
    }
  };
  const statusLabel = getStatusLabel();

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
              <div className="font-semibold capitalize">{statusLabel}</div>
              {health.status !== 'offline' && (
                <>
                  <div>{t('tooltip.uptime', { value: formatUptime(health.uptime) })}</div>
                  <div>{t('tooltip.response', { value: formatResponseTime(health.responseTime) })}</div>
                </>
              )}
              {health.status === 'offline' && health.lastError && (
                <div className="text-red-500">{t('tooltip.error', { message: health.lastError })}</div>
              )}
              {health.failureCount > 0 && (
                <div className="text-yellow-500">{t('tooltip.failures', { count: String(health.failureCount) })}</div>
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
            {statusLabel}
          </Badge>
        </div>
        {health.status === 'offline' && onReconnect && (
          <Button variant="outline" size="sm" onClick={onReconnect}>
            <RefreshCw aria-hidden className="h-4 w-4 mr-2" />
            {t('actions.reconnect')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {health.status !== 'offline' && (
          <>
            <div>
              <div className="text-muted-foreground">{t('labels.uptime')}</div>
              <div className="font-medium">{formatUptime(health.uptime)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('labels.responseTime')}</div>
              <div className="font-medium">{formatResponseTime(health.responseTime)}</div>
            </div>
          </>
        )}
        <div>
          <div className="text-muted-foreground">{t('labels.lastCheck')}</div>
          <div className="font-medium">
            {new Date(health.lastCheck).toLocaleTimeString()}
          </div>
        </div>
        {health.failureCount > 0 && (
          <div>
            <div className="text-muted-foreground">{t('labels.failures')}</div>
            <div className="font-medium text-yellow-500">{health.failureCount}</div>
          </div>
        )}
      </div>

      {health.lastError && (
        <div className="text-xs text-red-500 p-2 bg-red-50 dark:bg-red-950 rounded">
          <div className="font-semibold">{t('labels.lastError')}</div>
          <div>{health.lastError}</div>
        </div>
      )}
    </div>
  );
}

