'use client';

/**
 * ConnectionTypeIcon Component
 * Displays an icon representing the MCP transport type
 */

import type { MCPTransportType } from '@/lib/types';
import { Terminal, Radio, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionTypeIconProps {
  type: MCPTransportType;
  className?: string;
}

export function ConnectionTypeIcon({ type, className }: ConnectionTypeIconProps) {
  const icons = {
    stdio: Terminal,
    sse: Radio,
    http: Globe,
  };

  const Icon = icons[type];

  return <Icon className={cn('text-muted-foreground', className)} />;
}

