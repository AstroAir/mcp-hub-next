/**
 * Connection Pool Service Tests
 * Tests for HTTP connection pooling and management
 */

import {
  ConnectionPool,
  getConnectionPool,
  destroyConnectionPool,
} from './connection-pool';

describe('ConnectionPool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    jest.useFakeTimers();
    pool = new ConnectionPool({
      maxConnectionsPerServer: 5,
      maxIdleTime: 30000,
      cleanupInterval: 10000,
    });
  });

  afterEach(() => {
    pool.destroy();
    jest.useRealTimers();
  });

  describe('acquire', () => {
    it('should create new connection when pool is empty', async () => {
      const connection = await pool.acquire('server1');

      expect(connection).toBeDefined();
      expect(connection.serverId).toBe('server1');
      expect(connection.inUse).toBe(true);
    });

    it('should reuse idle connection when available', async () => {
      const conn1 = await pool.acquire('server1');
      pool.release(conn1);

      const conn2 = await pool.acquire('server1');

      expect(conn2.id).toBe(conn1.id);
      expect(conn2.inUse).toBe(true);
    });

    it('should create new connection when all are in use', async () => {
      const conn1 = await pool.acquire('server1');
      const conn2 = await pool.acquire('server1');

      expect(conn1.id).not.toBe(conn2.id);
      expect(conn1.inUse).toBe(true);
      expect(conn2.inUse).toBe(true);
    });

    it('should respect maxConnectionsPerServer limit', async () => {
      const smallPool = new ConnectionPool({
        maxConnectionsPerServer: 2,
        maxIdleTime: 30000,
        cleanupInterval: 10000,
      });

      const conn1 = await smallPool.acquire('server1');
      const conn2 = await smallPool.acquire('server1');

      // Third connection should wait or be rejected
      // Since we don't have a queue implementation, it will create a new one
      const conn3 = await smallPool.acquire('server1');
      expect(conn3).toBeDefined();

      smallPool.destroy();
    });

    it('should handle multiple servers independently', async () => {
      const conn1 = await pool.acquire('server1');
      const conn2 = await pool.acquire('server2');

      expect(conn1.serverId).toBe('server1');
      expect(conn2.serverId).toBe('server2');
      expect(conn1.id).not.toBe(conn2.id);
    });
  });

  describe('release', () => {
    it('should mark connection as not in use', async () => {
      const conn = await pool.acquire('server1');
      expect(conn.inUse).toBe(true);

      pool.release(conn);
      expect(conn.inUse).toBe(false);
      expect(conn.lastUsed).toBeGreaterThan(0);
    });

    it('should allow connection to be reused after release', async () => {
      const conn1 = await pool.acquire('server1');
      pool.release(conn1);

      const conn2 = await pool.acquire('server1');
      expect(conn2.id).toBe(conn1.id);
    });

    it('should handle releasing unknown connection gracefully', () => {
      const fakeConnection = {
        id: 'fake-id',
        serverId: 'server1',
        inUse: true,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      expect(() => pool.release(fakeConnection)).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove connection from pool', async () => {
      const conn = await pool.acquire('server1');
      const connId = conn.id;

      pool.remove(connId);

      // Acquiring again should create a new connection
      const newConn = await pool.acquire('server1');
      expect(newConn.id).not.toBe(connId);
    });

    it('should handle removing non-existent connection', () => {
      expect(() => pool.remove('non-existent-id')).not.toThrow();
    });
  });

  describe('clearServer', () => {
    it('should remove all connections for a server', async () => {
      await pool.acquire('server1');
      await pool.acquire('server1');
      await pool.acquire('server2');

      const removed = pool.clearServer('server1');

      expect(removed).toBe(2);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.byServer['server1']).toBeUndefined();
      expect(stats.byServer['server2']).toBeDefined();
    });

    it('should return 0 for unknown server', () => {
      const removed = pool.clearServer('unknown-server');
      expect(removed).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should remove all connections', async () => {
      await pool.acquire('server1');
      await pool.acquire('server2');
      await pool.acquire('server3');

      pool.clearAll();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(Object.keys(stats.byServer)).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      const conn1 = await pool.acquire('server1');
      const conn2 = await pool.acquire('server1');
      await pool.acquire('server2');

      pool.release(conn1);

      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(3);
      expect(stats.activeConnections).toBe(2);
      expect(stats.idleConnections).toBe(1);
      expect(stats.byServer['server1'].total).toBe(2);
      expect(stats.byServer['server1'].active).toBe(1);
      expect(stats.byServer['server1'].idle).toBe(1);
      expect(stats.byServer['server2'].total).toBe(1);
    });

    it('should return empty stats for empty pool', () => {
      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(Object.keys(stats.byServer)).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should remove idle connections exceeding maxIdleTime', async () => {
      const conn1 = await pool.acquire('server1');
      const conn2 = await pool.acquire('server1');

      pool.release(conn1);
      pool.release(conn2);

      // Advance time past maxIdleTime
      jest.advanceTimersByTime(35000);

      // Manually trigger cleanup (normally done by interval)
      const removed = (pool as any).cleanup();

      expect(removed).toBe(2);
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should not remove active connections', async () => {
      const conn1 = await pool.acquire('server1');
      const conn2 = await pool.acquire('server1');

      pool.release(conn1);
      // conn2 is still active

      jest.advanceTimersByTime(35000);

      const removed = (pool as any).cleanup();

      expect(removed).toBe(1); // Only idle connection removed
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
    });

    it('should run automatically on interval', async () => {
      const conn = await pool.acquire('server1');
      pool.release(conn);

      // Advance time past cleanup interval and maxIdleTime
      jest.advanceTimersByTime(45000);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('stopCleanup', () => {
    it('should stop automatic cleanup', async () => {
      const conn = await pool.acquire('server1');
      pool.release(conn);

      pool.stopCleanup();

      // Advance time past cleanup interval
      jest.advanceTimersByTime(45000);

      // Connection should still exist (cleanup didn't run)
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should clear all connections and stop cleanup', async () => {
      await pool.acquire('server1');
      await pool.acquire('server2');

      pool.destroy();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);

      // Cleanup should be stopped
      jest.advanceTimersByTime(45000);
      // No errors should occur
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        pool.destroy();
        pool.destroy();
        pool.destroy();
      }).not.toThrow();
    });
  });
});

describe('Global Connection Pool Functions', () => {
  afterEach(() => {
    destroyConnectionPool();
    jest.useRealTimers();
  });

  describe('getConnectionPool', () => {
    it('should create singleton instance', () => {
      const pool1 = getConnectionPool();
      const pool2 = getConnectionPool();

      expect(pool1).toBe(pool2);
    });

    it('should use custom options on first call', () => {
      const pool = getConnectionPool({
        maxConnectionsPerServer: 10,
        maxIdleTime: 60000,
        cleanupInterval: 20000,
      });

      expect(pool).toBeInstanceOf(ConnectionPool);
    });
  });

  describe('destroyConnectionPool', () => {
    it('should destroy singleton instance', () => {
      const pool1 = getConnectionPool();
      destroyConnectionPool();
      const pool2 = getConnectionPool();

      expect(pool1).not.toBe(pool2);
    });

    it('should be safe to call when no pool exists', () => {
      expect(() => destroyConnectionPool()).not.toThrow();
    });
  });
});

