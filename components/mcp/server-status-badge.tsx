'use client';

/**
 * ServerStatusBadge Component
 * Displays the connection status of an MCP server
 */

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { ConnectionStatus } from '@/lib/types';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

const statusVariant: Record<ConnectionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  disconnected: 'secondary',
  connecting: 'outline',
  connected: 'default',
  error: 'destructive',
  reconnecting: 'outline',
};

const statusColor: Record<ConnectionStatus, string> = {
  disconnected: 'text-gray-500',
  connecting: 'text-blue-500',
  connected: 'text-green-500',
  error: 'text-red-500',
  reconnecting: 'text-yellow-500',
};

export function ServerStatusBadge({ status, className }: ServerStatusBadgeProps) {
  const t = useTranslations('common.status');
  const variant = statusVariant[status];
  const color = statusColor[status];
  const label = (() => {
    switch (status) {
      case 'disconnected':
        return t('disconnected');
      case 'connecting':
        return t('connecting');
      case 'connected':
        return t('connected');
      case 'error':
        return t('error');
      case 'reconnecting':
        return t('reconnecting');
      default:
        return status;
    }
  })();

  return (
    <Badge variant={variant} className={cn('flex items-center gap-1', className)}>
      <Circle className={cn('h-2 w-2 fill-current', color)} />
      {label}
    </Badge>
  );
}

