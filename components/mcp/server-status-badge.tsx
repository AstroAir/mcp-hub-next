'use client';

/**
 * ServerStatusBadge Component
 * Displays the connection status of an MCP server
 */

import { Badge } from '@/components/ui/badge';
import type { ConnectionStatus } from '@/lib/types';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

const statusConfig: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  disconnected: {
    label: 'Disconnected',
    variant: 'secondary',
    color: 'text-gray-500',
  },
  connecting: {
    label: 'Connecting',
    variant: 'outline',
    color: 'text-blue-500',
  },
  connected: {
    label: 'Connected',
    variant: 'default',
    color: 'text-green-500',
  },
  error: {
    label: 'Error',
    variant: 'destructive',
    color: 'text-red-500',
  },
  reconnecting: {
    label: 'Reconnecting',
    variant: 'outline',
    color: 'text-yellow-500',
  },
};

export function ServerStatusBadge({ status, className }: ServerStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1', className)}>
      <Circle className={cn('h-2 w-2 fill-current', config.color)} />
      {config.label}
    </Badge>
  );
}

