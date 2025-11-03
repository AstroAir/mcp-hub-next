/**
 * Health Monitor Service Tests
 * Tests for server health monitoring and auto-reconnection
 */

import { healthMonitor } from './health-monitor';

// Mock getOrCreateClient
const mockClient = {
  listTools: jest.fn().mockResolvedValue({ tools: [] }),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('./mcp-client', () => ({
  getOrCreateClient: jest.fn(() => Promise.resolve(mockClient)),
  disconnectClient: jest.fn(() => Promise.resolve(undefined)),
}));

describe('Health Monitor Service', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    healthMonitor.stopAll();
  });

  afterEach(() => {
    healthMonitor.stopAll();
    jest.useRealTimers();
  });

  describe('startMonitoring', () => {
    it('should start monitoring a server', () => {
      const config = {
        serverId: 'server1',
        checkInterval: 30000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);

      const health = healthMonitor.getHealth('server1');
      expect(health).toBeDefined();
      expect(health?.status).toBe('checking');
    });

    it('should perform health checks at specified interval', async () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);

      // Advance time to trigger first check
      await jest.advanceTimersByTimeAsync(10000);

      expect(mockClient.listTools).toHaveBeenCalled();
    });

    it('should update health status to healthy on successful check', async () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);

      await jest.advanceTimersByTimeAsync(10000);

      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('healthy');
      expect(health?.lastCheck).toBeGreaterThan(0);
    });

    it('should update health status to unhealthy on failed check', async () => {
      mockClient.listTools.mockRejectedValueOnce(new Error('Connection failed'));

      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);

      await jest.advanceTimersByTimeAsync(10000);

      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('unhealthy');
      expect(health?.error).toBe('Connection failed');
    });

    it('should not start duplicate monitoring for same server', () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);
      healthMonitor.startMonitoring(config);

      // Should only have one monitoring instance
      const allHealth = healthMonitor.getAllHealth();
      expect(Object.keys(allHealth)).toHaveLength(1);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring a server', async () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);
      healthMonitor.stopMonitoring('server1');

      // Advance time - no checks should occur
      await jest.advanceTimersByTimeAsync(20000);

      expect(mockClient.listTools).not.toHaveBeenCalled();
    });

    it('should remove health status when stopped', () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);
      healthMonitor.stopMonitoring('server1');

      const health = healthMonitor.getHealth('server1');
      expect(health).toBeUndefined();
    });
  });

  describe('getHealth', () => {
    it('should return health status for a server', async () => {
      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      };

      healthMonitor.startMonitoring(config);
      await jest.advanceTimersByTimeAsync(10000);

      const health = healthMonitor.getHealth('server1');

      expect(health).toMatchObject({
        serverId: 'server1',
        status: 'healthy',
        lastCheck: expect.any(Number),
        consecutiveFailures: 0,
      });
    });

    it('should return undefined for non-monitored server', () => {
      const health = healthMonitor.getHealth('non-existent');
      expect(health).toBeUndefined();
    });
  });

  describe('getAllHealth', () => {
    it('should return health status for all monitored servers', async () => {
      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.startMonitoring({
        serverId: 'server2',
        checkInterval: 10000,
        timeout: 5000,
      });

      await jest.advanceTimersByTimeAsync(10000);

      const allHealth = healthMonitor.getAllHealth();

      expect(Object.keys(allHealth)).toHaveLength(2);
      expect(allHealth['server1']).toBeDefined();
      expect(allHealth['server2']).toBeDefined();
    });

    it('should return empty object when no servers monitored', () => {
      const allHealth = healthMonitor.getAllHealth();
      expect(allHealth).toEqual({});
    });
  });

  describe('Auto-Reconnection', () => {
    it('should attempt reconnection on failure', async () => {
      const { getOrCreateClient } = require('./mcp-client');

      mockClient.listTools
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ tools: [] });

      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
        maxRetries: 3,
        retryDelay: 5000,
      };

      healthMonitor.startMonitoring(config);

      // First check fails
      await jest.advanceTimersByTimeAsync(10000);

      let health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('unhealthy');
      expect(health?.consecutiveFailures).toBe(1);

      // Wait for retry
      await jest.advanceTimersByTimeAsync(5000);

      // Second check succeeds
      await jest.advanceTimersByTimeAsync(10000);

      health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('healthy');
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should use exponential backoff for retries', async () => {
      mockClient.listTools.mockRejectedValue(new Error('Failed'));

      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
        maxRetries: 3,
        retryDelay: 1000,
      };

      healthMonitor.startMonitoring(config);

      // First failure
      await jest.advanceTimersByTimeAsync(10000);

      let health = healthMonitor.getHealth('server1');
      expect(health?.consecutiveFailures).toBe(1);

      // Second failure (after 2x delay)
      await jest.advanceTimersByTimeAsync(12000);

      health = healthMonitor.getHealth('server1');
      expect(health?.consecutiveFailures).toBe(2);

      // Third failure (after 4x delay)
      await jest.advanceTimersByTimeAsync(14000);

      health = healthMonitor.getHealth('server1');
      expect(health?.consecutiveFailures).toBe(3);
    });

    it('should stop retrying after maxRetries', async () => {
      mockClient.listTools.mockRejectedValue(new Error('Failed'));

      const config = {
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 1000,
      };

      healthMonitor.startMonitoring(config);

      // Exhaust retries
      await jest.advanceTimersByTimeAsync(10000); // First failure
      await jest.advanceTimersByTimeAsync(12000); // Second failure
      await jest.advanceTimersByTimeAsync(14000); // Third failure (max reached)

      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('unhealthy');
      expect(health?.consecutiveFailures).toBe(3);
    });
  });

  describe('Listeners', () => {
    it('should notify listeners on health status change', async () => {
      const listener = jest.fn();

      healthMonitor.addListener('server1', listener);

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      await jest.advanceTimersByTimeAsync(10000);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server1',
          status: 'healthy',
        })
      );
    });

    it('should support multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      healthMonitor.addListener('server1', listener1);
      healthMonitor.addListener('server1', listener2);

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      await jest.advanceTimersByTimeAsync(10000);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove listeners', async () => {
      const listener = jest.fn();

      healthMonitor.addListener('server1', listener);
      healthMonitor.removeListener('server1', listener);

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      await jest.advanceTimersByTimeAsync(10000);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update monitoring configuration', async () => {
      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.updateConfig('server1', {
        checkInterval: 5000,
        timeout: 3000,
      });

      // New interval should be used
      await jest.advanceTimersByTimeAsync(5000);

      expect(mockClient.listTools).toHaveBeenCalled();
    });

    it('should not affect other servers', () => {
      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.startMonitoring({
        serverId: 'server2',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.updateConfig('server1', {
        checkInterval: 5000,
      });

      const health2 = healthMonitor.getHealth('server2');
      expect(health2).toBeDefined();
    });
  });

  describe('manualReconnect', () => {
    it('should trigger immediate reconnection attempt', async () => {
      const { disconnectClient, getOrCreateClient } = require('./mcp-client');

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      await healthMonitor.manualReconnect('server1');

      expect(disconnectClient).toHaveBeenCalledWith('server1');
      expect(getOrCreateClient).toHaveBeenCalled();
    });

    it('should reset consecutive failures on manual reconnect', async () => {
      mockClient.listTools
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ tools: [] });

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      // Cause failure
      await jest.advanceTimersByTimeAsync(10000);

      let health = healthMonitor.getHealth('server1');
      expect(health?.consecutiveFailures).toBe(1);

      // Manual reconnect
      await healthMonitor.manualReconnect('server1');

      health = healthMonitor.getHealth('server1');
      expect(health?.consecutiveFailures).toBe(0);
      expect(health?.status).toBe('healthy');
    });
  });

  describe('stopAll', () => {
    it('should stop monitoring all servers', async () => {
      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.startMonitoring({
        serverId: 'server2',
        checkInterval: 10000,
        timeout: 5000,
      });

      healthMonitor.stopAll();

      const allHealth = healthMonitor.getAllHealth();
      expect(Object.keys(allHealth)).toHaveLength(0);

      // No checks should occur
      await jest.advanceTimersByTimeAsync(20000);
      expect(mockClient.listTools).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle timeout during health check', async () => {
      mockClient.listTools.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      healthMonitor.startMonitoring({
        serverId: 'server1',
        checkInterval: 10000,
        timeout: 1000,
      });

      await jest.advanceTimersByTimeAsync(10000);

      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('unhealthy');
      expect(health?.error).toContain('timeout');
    });

    it('should handle rapid start/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        healthMonitor.startMonitoring({
          serverId: 'server1',
          checkInterval: 10000,
          timeout: 5000,
        });
        healthMonitor.stopMonitoring('server1');
      }

      const health = healthMonitor.getHealth('server1');
      expect(health).toBeUndefined();
    });

    it('should handle monitoring server with no config', () => {
      expect(() => {
        healthMonitor.startMonitoring({
          serverId: 'server1',
          checkInterval: 0,
          timeout: 0,
        });
      }).not.toThrow();
    });
  });
});

