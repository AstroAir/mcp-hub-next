'use client';

/**
 * Server Lifecycle Controls Component
 * Provides controls for starting, stopping, and restarting MCP servers
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Square, RotateCw, Loader2, Activity } from 'lucide-react';
import { lifecycleAPI } from '@/lib/services/api-client';
import { useLifecycleStore } from '@/lib/stores/lifecycle-store';
import type { MCPServerConfig, LifecycleState } from '@/lib/types';

interface ServerLifecycleControlsProps {
  serverId: string;
  config: MCPServerConfig;
  compact?: boolean;
}

export function ServerLifecycleControls({ serverId, config, compact = false }: ServerLifecycleControlsProps) {
  const t = useTranslations('components.lifecycle');
  const status = useTranslations('components.lifecycle.status');
  const metrics = useTranslations('components.lifecycle.metrics');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { processes, setProcess, updateProcessState } = useLifecycleStore();

  const process = processes[serverId];
  const state: LifecycleState = process?.state || 'stopped';

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await lifecycleAPI.start({ serverId, config });

      if (response.success && response.data) {
        setProcess(serverId, response.data);
      } else {
  setError(response.error || t('errors.start')); 
      }
    } catch (err) {
  setError(err instanceof Error ? err.message : t('errors.start'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await lifecycleAPI.stop({ serverId, force: false });

      if (response.success) {
        updateProcessState(serverId, { state: 'stopped', stoppedAt: new Date().toISOString() });
      } else {
  setError(response.error || t('errors.stop'));
      }
    } catch (err) {
  setError(err instanceof Error ? err.message : t('errors.stop'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await lifecycleAPI.restart({ serverId, config });

      if (response.success && response.data) {
        setProcess(serverId, response.data);
      } else {
  setError(response.error || t('errors.restart'));
      }
    } catch (err) {
  setError(err instanceof Error ? err.message : t('errors.restart'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStateBadge = () => {
    const variants: Record<LifecycleState, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      stopped: { variant: 'secondary', label: status('stopped') },
      starting: { variant: 'default', label: status('starting') },
      running: { variant: 'default', label: status('running') },
      stopping: { variant: 'secondary', label: status('stopping') },
      restarting: { variant: 'default', label: status('restarting') },
      error: { variant: 'destructive', label: status('error') },
    };

    const { variant, label } = variants[state];

    return (
      <Badge variant={variant} className="gap-1">
        {(state === 'starting' || state === 'stopping' || state === 'restarting') && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {state === 'running' && <Activity className="h-3 w-3" />}
        {label}
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStateBadge()}
        <TooltipProvider>
          {state === 'stopped' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStart}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('tooltip.start')}</TooltipContent>
            </Tooltip>
          )}

          {state === 'running' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStop}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('tooltip.stop')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestart}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('tooltip.restart')}</TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{t('statusTitle')}</h4>
            {getStateBadge()}
          </div>
          {process && (
            <div className="text-sm text-muted-foreground">
              {process.pid && <span>{metrics('pid', { value: String(process.pid) })}</span>}
              {process.uptime !== undefined && (
                <span className="ml-3">{metrics('uptime', { value: formatUptime(process.uptime) })}</span>
              )}
              {process.restartCount > 0 && (
                <span className="ml-3">{metrics('restarts', { count: String(process.restartCount) })}</span>
              )}
            </div>
          )}
          {process?.lastError && (
            <div className="text-sm text-red-500">{metrics('lastError', { message: process.lastError })}</div>
          )}
        </div>

        <div className="flex gap-2">
          {state === 'stopped' && (
            <Button onClick={handleStart} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {t('actions.start')}
            </Button>
          )}

          {state === 'running' && (
            <>
              <Button variant="outline" onClick={handleStop} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                {t('actions.stop')}
              </Button>
              <Button variant="outline" onClick={handleRestart} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                {t('actions.restart')}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Process Metrics */}
      {process && state === 'running' && (
        <div className="grid grid-cols-3 gap-4 rounded-md border p-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{metrics('memoryLabel')}</div>
            <div className="text-2xl font-bold">
              {process.memoryUsage ? formatBytes(process.memoryUsage) : metrics('na')}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">{metrics('cpuLabel')}</div>
            <div className="text-2xl font-bold">
              {process.cpuUsage !== undefined ? `${process.cpuUsage.toFixed(1)}%` : metrics('na')}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">{metrics('uptimeLabel')}</div>
            <div className="text-2xl font-bold">
              {process.uptime !== undefined ? formatUptime(process.uptime) : metrics('na')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format uptime in seconds to human-readable format
 */
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

