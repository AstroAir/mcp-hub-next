/**
 * Health Monitor Service Tests (aligned with current implementation)
 */

import { healthMonitor } from './health-monitor';
import type { MCPServerConfig } from '../types/mcp';

// Mock getOrCreateClient
const mockClient = {
  listTools: jest.fn().mockResolvedValue({ tools: [] }),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('./mcp-client', () => ({
  getOrCreateClient: jest.fn(() => Promise.resolve(mockClient)),
  disconnectClient: jest.fn(() => Promise.resolve(undefined)),
}));

function makeServer(id: string, name = `Server ${id}`): MCPServerConfig {
  return {
    id,
    name,
    description: 'test',
    transportType: 'sse',
    url: 'http://localhost:1234',
    headers: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as MCPServerConfig;
}

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
    it('starts monitoring and performs an initial health check', async () => {
      const server = makeServer('server1');
      healthMonitor.startMonitoring(server);

      // Let initial async health check resolve
      await Promise.resolve();

      const health = healthMonitor.getHealth('server1');
      expect(health).toBeDefined();
    });

    it('performs periodic health checks', async () => {
      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
      healthMonitor.startMonitoring(server);

      await jest.advanceTimersByTimeAsync(10000);
      expect(mockClient.listTools).toHaveBeenCalled();
    });

    it('sets status to healthy on successful check', async () => {
      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
      healthMonitor.startMonitoring(server);

      await jest.advanceTimersByTimeAsync(10000);
      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('healthy');
      expect(typeof health?.lastCheck).toBe('string');
    });

    it('sets status to offline on failed check', async () => {
      mockClient.listTools.mockRejectedValueOnce(new Error('Connection failed'));
      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });

      const listener = jest.fn();
      healthMonitor.addListener(listener);
      healthMonitor.startMonitoring(server);

      // Allow initial health check to run
      await jest.advanceTimersByTimeAsync(1);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ serverId: 'server1', status: 'offline' })
      );

      healthMonitor.removeListener(listener);
    });
  });

  describe('stopMonitoring', () => {
    it('stops monitoring and clears status', async () => {
  const server = makeServer('server1');
  healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
  healthMonitor.startMonitoring(server);
  // Let initial check complete
  await jest.advanceTimersByTimeAsync(1);
  healthMonitor.stopMonitoring('server1');

  const callsBefore = mockClient.listTools.mock.calls.length;
      await jest.advanceTimersByTimeAsync(20000);
      expect(mockClient.listTools.mock.calls.length).toBe(callsBefore);
      expect(healthMonitor.getHealth('server1')).toBeUndefined();
    });
  });

  describe('getAllHealth', () => {
    it('returns array of health entries', async () => {
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
      healthMonitor.startMonitoring(makeServer('server1'));
      healthMonitor.startMonitoring(makeServer('server2'));

      await jest.advanceTimersByTimeAsync(10000);
      const all = healthMonitor.getAllHealth();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(2);
      const ids = all.map(h => h.serverId);
      expect(ids).toEqual(expect.arrayContaining(['server1','server2']));
    });
  });

  describe('Auto-Reconnection', () => {
    it('attempts reconnection with exponential backoff', async () => {
      mockClient.listTools
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValueOnce({ tools: [] });

      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000, retryDelay: 1000, maxRetries: 3 });
      healthMonitor.startMonitoring(server);

      // First failure
      await jest.advanceTimersByTimeAsync(10000);
      let health = healthMonitor.getHealth('server1');
      expect(health?.failureCount).toBe(1);
      expect(health?.status).toBe('offline');

      // Retry after 1s
      await jest.advanceTimersByTimeAsync(1000);
      // Second failure will schedule next retry after 2s
      await Promise.resolve();

      // Advance 2s for next retry
      await jest.advanceTimersByTimeAsync(2000);

      // After success, failure count resets
      health = healthMonitor.getHealth('server1');
      expect(health?.failureCount).toBe(0);
      expect(health?.status).toBe('healthy');
    });
  });

  describe('Listeners', () => {
    it('notifies listeners on health change', async () => {
      const listener = jest.fn();
      healthMonitor.addListener(listener);
      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
      healthMonitor.startMonitoring(server);
      await jest.advanceTimersByTimeAsync(10000);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ serverId: 'server1' }));
      healthMonitor.removeListener(listener);
    });
  });

  describe('updateConfig', () => {
    it('updates global monitoring configuration', () => {
      healthMonitor.updateConfig({ checkInterval: 5000, timeout: 3000 });
      // No throw implies success; behavior covered in other tests
    });
  });

  describe('manualReconnect', () => {
    it('disconnects and reconnects immediately', async () => {
      const { disconnectClient, getOrCreateClient } = require('./mcp-client');
      const server = makeServer('server1');
      healthMonitor.startMonitoring(server);

      await healthMonitor.manualReconnect(server);
      expect(disconnectClient).toHaveBeenCalledWith('server1');
      expect(getOrCreateClient).toHaveBeenCalled();
    });
  });

  describe('stopAll', () => {
    it('stops monitoring all servers and clears state', async () => {
  healthMonitor.updateConfig({ checkInterval: 10000, timeout: 5000 });
  healthMonitor.startMonitoring(makeServer('server1'));
  healthMonitor.startMonitoring(makeServer('server2'));
  // Let initial checks complete
  await jest.advanceTimersByTimeAsync(1);
  const callsBefore = mockClient.listTools.mock.calls.length;
      healthMonitor.stopAll();
      expect(healthMonitor.getAllHealth()).toHaveLength(0);
      await jest.advanceTimersByTimeAsync(20000);
      expect(mockClient.listTools.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('Edge Cases', () => {
    it('handles timeout during health check', async () => {
      mockClient.listTools.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const server = makeServer('server1');
      healthMonitor.updateConfig({ checkInterval: 10000, timeout: 1000 });
      healthMonitor.startMonitoring(server);

      // Advance past timeout but before next interval
      await jest.advanceTimersByTimeAsync(1200);
      const health = healthMonitor.getHealth('server1');
      expect(health?.status).toBe('offline');
      expect(health?.lastError?.toLowerCase()).toContain('timeout');
    });
  });
});

