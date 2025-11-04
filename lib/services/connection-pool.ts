/**
 * HTTP Connection Pool
 * Manages connection pooling for HTTP MCP servers
 */

export interface PooledConnection {
  id: string;
  serverId: string;
  url: string;
  headers?: Record<string, string>;
  createdAt: number;
  lastUsedAt: number;
  // Alias used by some callers/tests
  lastUsed?: number;
  useCount: number;
  isActive: boolean;
  inUse: boolean;
}

export interface ConnectionPoolOptions {
  maxConnections?: number;
  maxIdleTime?: number; // milliseconds
  maxConnectionAge?: number; // milliseconds
  cleanupInterval?: number; // milliseconds
}

const DEFAULT_OPTIONS: Required<ConnectionPoolOptions> = {
  maxConnections: 10,
  maxIdleTime: 60000, // 1 minute
  maxConnectionAge: 300000, // 5 minutes
  cleanupInterval: 30000, // 30 seconds
};

export class ConnectionPool {
  private pools: Map<string, PooledConnection[]> = new Map();
  private options: Required<ConnectionPoolOptions>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: ConnectionPoolOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCleanup();
  }

  /**
   * Get or create a connection from the pool
   */
  async acquire(serverId: string, url: string, headers?: Record<string, string>): Promise<PooledConnection> {
    const pool = this.pools.get(serverId) || [];

    // Try to find an available connection
    const available = pool.find((conn) => !conn.isActive && conn.url === url);

    if (available) {
      // Reuse existing connection
      available.isActive = true;
      available.inUse = true;
      available.lastUsedAt = Date.now();
      available.lastUsed = available.lastUsedAt;
      available.useCount++;
      return available;
    }

    // Check if we can create a new connection
    if (pool.length >= this.options.maxConnections) {
      // Wait for a connection to become available
      return this.waitForConnection(serverId, url, headers);
    }

    // Create new connection
    const connection: PooledConnection = {
      id: `${serverId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serverId,
      url,
      headers,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      isActive: true,
      inUse: true,
    };

    pool.push(connection);
    this.pools.set(serverId, pool);

    return connection;
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: PooledConnection | string): void {
    const connectionId = typeof connection === 'string' ? connection : connection.id;
    for (const pool of this.pools.values()) {
      const conn = pool.find((c) => c.id === connectionId);
      if (conn) {
        conn.isActive = false;
        conn.inUse = false;
        conn.lastUsedAt = Date.now();
        conn.lastUsed = conn.lastUsedAt;
        return;
      }
    }
  }

  /**
   * Remove a connection from the pool
   */
  remove(connectionId: string): void {
    for (const [serverId, pool] of this.pools.entries()) {
      const index = pool.findIndex((conn) => conn.id === connectionId);
      if (index !== -1) {
        pool.splice(index, 1);
        if (pool.length === 0) {
          this.pools.delete(serverId);
        }
        return;
      }
    }
  }

  /**
   * Clear all connections for a server
   */
  clearServer(serverId: string): number {
    const pool = this.pools.get(serverId);
    const removed = pool ? pool.length : 0;
    this.pools.delete(serverId);
    return removed;
  }

  /**
   * Clear all connections
   */
  clearAll(): void {
    this.pools.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(serverId?: string): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    byServer: Record<string, { total: number; active: number; idle: number }>;
  } {
    const byServer: Record<string, { total: number; active: number; idle: number }> = {};

    for (const [sid, pool] of this.pools.entries()) {
      byServer[sid] = {
        total: pool.length,
        active: pool.filter((c) => c.isActive).length,
        idle: pool.filter((c) => !c.isActive).length,
      };
    }

    if (serverId) {
      const pool = this.pools.get(serverId) || [];
      return {
        totalConnections: pool.length,
        activeConnections: pool.filter((c) => c.isActive).length,
        idleConnections: pool.filter((c) => !c.isActive).length,
        byServer: { [serverId]: byServer[serverId] || { total: 0, active: 0, idle: 0 } },
      };
    }

    let total = 0;
    let active = 0;
    let idle = 0;

    for (const pool of this.pools.values()) {
      total += pool.length;
      active += pool.filter((c) => c.isActive).length;
      idle += pool.filter((c) => !c.isActive).length;
    }

    return {
      totalConnections: total,
      activeConnections: active,
      idleConnections: idle,
      byServer,
    };
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(
    serverId: string,
    url: string,
    headers?: Record<string, string>,
    timeout: number = 5000
  ): Promise<PooledConnection> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const pool = this.pools.get(serverId) || [];
        const available = pool.find((conn) => !conn.isActive && conn.url === url);

        if (available) {
          clearInterval(checkInterval);
          available.isActive = true;
          available.lastUsedAt = Date.now();
          available.useCount++;
          resolve(available);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Connection pool timeout'));
        }
      }, 100);
    });
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clean up stale connections
   */
  private cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [serverId, pool] of this.pools.entries()) {
      const toRemove: number[] = [];

      pool.forEach((conn, index) => {
        // Remove if idle for too long
        if (!conn.isActive && now - conn.lastUsedAt > this.options.maxIdleTime) {
          toRemove.push(index);
        }
        // Remove if too old
        else if (now - conn.createdAt > this.options.maxConnectionAge) {
          toRemove.push(index);
        }
      });

      // Remove in reverse order to maintain indices
      toRemove.reverse().forEach((index) => {
        pool.splice(index, 1);
        removed++;
      });

      // Remove empty pools
      if (pool.length === 0) {
        this.pools.delete(serverId);
      }
    }

    return removed;
  }

  /**
   * Destroy the pool
   */
  destroy(): void {
    this.stopCleanup();
    this.clearAll();
  }
}

// Global connection pool instance
let globalPool: ConnectionPool | null = null;

/**
 * Get the global connection pool instance
 */
export function getConnectionPool(options?: ConnectionPoolOptions): ConnectionPool {
  if (!globalPool) {
    globalPool = new ConnectionPool(options);
  }
  return globalPool;
}

/**
 * Destroy the global connection pool
 */
export function destroyConnectionPool(): void {
  if (globalPool) {
    globalPool.destroy();
    globalPool = null;
  }
}

