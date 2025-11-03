/**
 * Health Monitor Service
 * Monitors server health and handles auto-reconnection
 */

import { getOrCreateClient, disconnectClient } from './mcp-client';
import { addDebugLog } from './debug-logger';
import type { MCPServerConfig } from '@/lib/types';

export type HealthStatus = 'healthy' | 'degraded' | 'offline';

export interface ServerHealth {
  serverId: string;
  status: HealthStatus;
  lastCheck: string;
  uptime: number; // milliseconds
  responseTime: number; // milliseconds
  failureCount: number;
  lastError?: string;
}

export interface HealthMonitorConfig {
  checkInterval: number; // milliseconds
  timeout: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds (base delay for exponential backoff)
}

const DEFAULT_CONFIG: HealthMonitorConfig = {
  checkInterval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

class HealthMonitor {
  private config: HealthMonitorConfig;
  private healthStatus: Map<string, ServerHealth>;
  private intervals: Map<string, NodeJS.Timeout>;
  private retryTimeouts: Map<string, NodeJS.Timeout>;
  private connectionStartTimes: Map<string, number>;
  private listeners: Set<(health: ServerHealth) => void>;

  constructor(config: Partial<HealthMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.healthStatus = new Map();
    this.intervals = new Map();
    this.retryTimeouts = new Map();
    this.connectionStartTimes = new Map();
    this.listeners = new Set();
  }

  /**
   * Start monitoring a server
   */
  startMonitoring(serverConfig: MCPServerConfig): void {
    const { id } = serverConfig;

    // Stop existing monitoring if any
    this.stopMonitoring(id);

    // Initialize health status
    this.healthStatus.set(id, {
      serverId: id,
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      responseTime: 0,
      failureCount: 0,
    });

    this.connectionStartTimes.set(id, Date.now());

    // Start periodic health checks
    const interval = setInterval(() => {
      this.performHealthCheck(serverConfig);
    }, this.config.checkInterval);

    this.intervals.set(id, interval);

    // Perform initial health check
    this.performHealthCheck(serverConfig);

    addDebugLog('info', 'system', `Started health monitoring for ${serverConfig.name}`, {
      serverId: id,
      serverName: serverConfig.name,
    });
  }

  /**
   * Stop monitoring a server
   */
  stopMonitoring(serverId: string): void {
    const interval = this.intervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(serverId);
    }

    const retryTimeout = this.retryTimeouts.get(serverId);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      this.retryTimeouts.delete(serverId);
    }

    this.healthStatus.delete(serverId);
    this.connectionStartTimes.delete(serverId);

    addDebugLog('info', 'system', `Stopped health monitoring for server ${serverId}`, {
      serverId,
    });
  }

  /**
   * Perform a health check on a server
   */
  private async performHealthCheck(serverConfig: MCPServerConfig): Promise<void> {
    const { id, name } = serverConfig;
    const startTime = Date.now();

    try {
      // Try to get or create client (this will test the connection)
      const client = await Promise.race([
        getOrCreateClient(serverConfig),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      // Try to list tools as a health check
      await Promise.race([
        client.listTools(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      const responseTime = Date.now() - startTime;
      const connectionStart = this.connectionStartTimes.get(id) || Date.now();
      const uptime = Date.now() - connectionStart;

      const health: ServerHealth = {
        serverId: id,
        status: responseTime > this.config.timeout * 0.8 ? 'degraded' : 'healthy',
        lastCheck: new Date().toISOString(),
        uptime,
        responseTime,
        failureCount: 0,
      };

      this.healthStatus.set(id, health);
      this.notifyListeners(health);

      addDebugLog('debug', 'connection', `Health check passed for ${name}`, {
        serverId: id,
        serverName: name,
        data: { responseTime, uptime },
      });
    } catch (error) {
      const currentHealth = this.healthStatus.get(id);
      const failureCount = (currentHealth?.failureCount || 0) + 1;

      const health: ServerHealth = {
        serverId: id,
        status: 'offline',
        lastCheck: new Date().toISOString(),
        uptime: 0,
        responseTime: 0,
        failureCount,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };

      this.healthStatus.set(id, health);
      this.notifyListeners(health);

      addDebugLog('error', 'connection', `Health check failed for ${name}`, {
        serverId: id,
        serverName: name,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Attempt auto-reconnect with exponential backoff
      if (failureCount <= this.config.maxRetries) {
        this.scheduleReconnect(serverConfig, failureCount);
      } else {
        addDebugLog('error', 'connection', `Max retries exceeded for ${name}`, {
          serverId: id,
          serverName: name,
        });
      }
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(serverConfig: MCPServerConfig, attemptNumber: number): void {
    const { id, name } = serverConfig;

    // Clear any existing retry timeout
    const existingTimeout = this.retryTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Calculate delay with exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, attemptNumber - 1);

    addDebugLog('info', 'connection', `Scheduling reconnect for ${name} in ${delay}ms`, {
      serverId: id,
      serverName: name,
      data: { attemptNumber, delay },
    });

    const timeout = setTimeout(async () => {
      try {
        // Disconnect first
        await disconnectClient(id);

        // Reset connection start time
        this.connectionStartTimes.set(id, Date.now());

        // Attempt to reconnect
        await getOrCreateClient(serverConfig);

        addDebugLog('info', 'connection', `Reconnected to ${name}`, {
          serverId: id,
          serverName: name,
        });

        // Reset failure count on successful reconnect
        const health = this.healthStatus.get(id);
        if (health) {
          health.failureCount = 0;
          health.status = 'healthy';
          this.healthStatus.set(id, health);
          this.notifyListeners(health);
        }
      } catch (error) {
        addDebugLog('error', 'connection', `Reconnect failed for ${name}`, {
          serverId: id,
          serverName: name,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      this.retryTimeouts.delete(id);
    }, delay);

    this.retryTimeouts.set(id, timeout);
  }

  /**
   * Get health status for a server
   */
  getHealth(serverId: string): ServerHealth | undefined {
    return this.healthStatus.get(serverId);
  }

  /**
   * Get health status for all monitored servers
   */
  getAllHealth(): ServerHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Add a listener for health status changes
   */
  addListener(listener: (health: ServerHealth) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (health: ServerHealth) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of health status change
   */
  private notifyListeners(health: ServerHealth): void {
    this.listeners.forEach((listener) => {
      try {
        listener(health);
      } catch (error) {
        console.error('Error in health monitor listener:', error);
      }
    });
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<HealthMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Manually trigger a reconnect
   */
  async manualReconnect(serverConfig: MCPServerConfig): Promise<void> {
    const { id, name } = serverConfig;

    try {
      // Disconnect first
      await disconnectClient(id);

      // Reset connection start time
      this.connectionStartTimes.set(id, Date.now());

      // Attempt to reconnect
      await getOrCreateClient(serverConfig);

      // Reset failure count
      const health = this.healthStatus.get(id);
      if (health) {
        health.failureCount = 0;
        health.status = 'healthy';
        this.healthStatus.set(id, health);
        this.notifyListeners(health);
      }

      addDebugLog('info', 'connection', `Manual reconnect successful for ${name}`, {
        serverId: id,
        serverName: name,
      });
    } catch (error) {
      addDebugLog('error', 'connection', `Manual reconnect failed for ${name}`, {
        serverId: id,
        serverName: name,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.intervals.clear();
    this.retryTimeouts.clear();
    this.healthStatus.clear();
    this.connectionStartTimes.clear();
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

