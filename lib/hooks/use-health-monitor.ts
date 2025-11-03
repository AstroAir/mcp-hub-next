/**
 * useHealthMonitor Hook (Client-side stub)
 * Provides health monitoring interface without Node.js dependencies
 * Real health monitoring should be done server-side via API routes
 */

import { useState, useCallback } from 'react';
import type { MCPServerConfig } from '@/lib/types';

export type HealthStatus = 'healthy' | 'degraded' | 'offline';

export interface ServerHealth {
  serverId: string;
  status: HealthStatus;
  lastCheck: string;
  uptime: number;
  responseTime: number;
  failureCount: number;
  lastError?: string;
}

export interface HealthMonitorConfig {
  checkInterval: number;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export function useHealthMonitor() {
  const [healthStatuses] = useState<Map<string, ServerHealth>>(new Map());

  const startMonitoring = useCallback((_serverConfig: MCPServerConfig) => {
    // Client-side stub - health monitoring should be done server-side
    console.warn('Health monitoring not available on client-side');
  }, []);

  const stopMonitoring = useCallback((_serverId: string) => {
    // Client-side stub
  }, []);

  const manualReconnect = useCallback(async (_serverConfig: MCPServerConfig) => {
    // Client-side stub
    console.warn('Manual reconnect not available on client-side');
  }, []);

  const updateConfig = useCallback((_config: Partial<HealthMonitorConfig>) => {
    // Client-side stub
  }, []);

  const getHealth = useCallback((serverId: string): ServerHealth | undefined => {
    return healthStatuses.get(serverId);
  }, [healthStatuses]);

  return {
    healthStatuses,
    startMonitoring,
    stopMonitoring,
    manualReconnect,
    updateConfig,
    getHealth,
  };
}
