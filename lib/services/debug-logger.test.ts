/**
 * Debug Logger Service Tests
 * Tests for logging, performance metrics, and debugging utilities
 */

import {
  getDebugLogs,
  addDebugLog,
  clearDebugLogs,
  exportDebugLogs,
  getPerformanceMetrics,
  addPerformanceMetric,
  clearPerformanceMetrics,
  getServerPerformanceStats,
  measurePerformance,
  logMCPRequest,
  logMCPResponse,
  logMCPError,
} from './debug-logger';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Debug Logger Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Debug Logs', () => {
    describe('addDebugLog', () => {
      it('should add a debug log entry', () => {
        addDebugLog({
          level: 'info',
          message: 'Test message',
          serverId: 'server1',
        });

        const logs = getDebugLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
          level: 'info',
          message: 'Test message',
          serverId: 'server1',
          timestamp: expect.any(Number),
        });
      });

      it('should add log with metadata', () => {
        addDebugLog({
          level: 'error',
          message: 'Error occurred',
          serverId: 'server1',
          metadata: { errorCode: 500, details: 'Internal error' },
        });

        const logs = getDebugLogs();
        expect(logs[0].metadata).toEqual({
          errorCode: 500,
          details: 'Internal error',
        });
      });

      it('should enforce max logs limit (1000)', () => {
        // Add 1100 logs
        for (let i = 0; i < 1100; i++) {
          addDebugLog({
            level: 'info',
            message: `Log ${i}`,
            serverId: 'server1',
          });
        }

        const logs = getDebugLogs();
        expect(logs).toHaveLength(1000);
        // Should keep the most recent logs
        expect(logs[logs.length - 1].message).toBe('Log 1099');
      });

      it('should handle different log levels', () => {
        addDebugLog({ level: 'debug', message: 'Debug', serverId: 's1' });
        addDebugLog({ level: 'info', message: 'Info', serverId: 's1' });
        addDebugLog({ level: 'warn', message: 'Warn', serverId: 's1' });
        addDebugLog({ level: 'error', message: 'Error', serverId: 's1' });

        const logs = getDebugLogs();
        expect(logs).toHaveLength(4);
        expect(logs.map((l) => l.level)).toEqual(['debug', 'info', 'warn', 'error']);
      });
    });

    describe('getDebugLogs', () => {
      it('should return empty array when no logs exist', () => {
        const logs = getDebugLogs();
        expect(logs).toEqual([]);
      });

      it('should filter logs by serverId', () => {
        addDebugLog({ level: 'info', message: 'Server 1', serverId: 'server1' });
        addDebugLog({ level: 'info', message: 'Server 2', serverId: 'server2' });
        addDebugLog({ level: 'info', message: 'Server 1 again', serverId: 'server1' });

        const logs = getDebugLogs('server1');
        expect(logs).toHaveLength(2);
        expect(logs.every((l) => l.serverId === 'server1')).toBe(true);
      });

      it('should filter logs by level', () => {
        addDebugLog({ level: 'info', message: 'Info', serverId: 's1' });
        addDebugLog({ level: 'error', message: 'Error', serverId: 's1' });
        addDebugLog({ level: 'warn', message: 'Warn', serverId: 's1' });

        const logs = getDebugLogs(undefined, 'error');
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('error');
      });

      it('should filter by both serverId and level', () => {
        addDebugLog({ level: 'info', message: 'S1 Info', serverId: 'server1' });
        addDebugLog({ level: 'error', message: 'S1 Error', serverId: 'server1' });
        addDebugLog({ level: 'error', message: 'S2 Error', serverId: 'server2' });

        const logs = getDebugLogs('server1', 'error');
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
          serverId: 'server1',
          level: 'error',
        });
      });

      it('should handle corrupted log data', () => {
        localStorageMock.setItem('mcp-hub-debug-logs', 'invalid json');

        const logs = getDebugLogs();
        expect(logs).toEqual([]);
      });
    });

    describe('clearDebugLogs', () => {
      it('should clear all logs', () => {
        addDebugLog({ level: 'info', message: 'Test', serverId: 's1' });
        addDebugLog({ level: 'info', message: 'Test 2', serverId: 's1' });

        clearDebugLogs();

        const logs = getDebugLogs();
        expect(logs).toEqual([]);
      });

      it('should clear logs for specific server', () => {
        addDebugLog({ level: 'info', message: 'S1', serverId: 'server1' });
        addDebugLog({ level: 'info', message: 'S2', serverId: 'server2' });

        clearDebugLogs('server1');

        const logs = getDebugLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].serverId).toBe('server2');
      });
    });

    describe('exportDebugLogs', () => {
      it('should export logs as JSON string', () => {
        addDebugLog({ level: 'info', message: 'Test', serverId: 's1' });

        const exported = exportDebugLogs();
        const parsed = JSON.parse(exported);

        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toMatchObject({
          level: 'info',
          message: 'Test',
          serverId: 's1',
        });
      });

      it('should export filtered logs', () => {
        addDebugLog({ level: 'info', message: 'S1', serverId: 'server1' });
        addDebugLog({ level: 'error', message: 'S2', serverId: 'server2' });

        const exported = exportDebugLogs('server1');
        const parsed = JSON.parse(exported);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].serverId).toBe('server1');
      });
    });
  });

  describe('Performance Metrics', () => {
    describe('addPerformanceMetric', () => {
      it('should add a performance metric', () => {
        addPerformanceMetric({
          serverId: 'server1',
          operation: 'tool_call',
          duration: 150,
        });

        const metrics = getPerformanceMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0]).toMatchObject({
          serverId: 'server1',
          operation: 'tool_call',
          duration: 150,
          timestamp: expect.any(Number),
        });
      });

      it('should add metric with metadata', () => {
        addPerformanceMetric({
          serverId: 'server1',
          operation: 'api_call',
          duration: 200,
          metadata: { endpoint: '/api/test', status: 200 },
        });

        const metrics = getPerformanceMetrics();
        expect(metrics[0].metadata).toEqual({
          endpoint: '/api/test',
          status: 200,
        });
      });

      it('should enforce max metrics limit (500)', () => {
        for (let i = 0; i < 600; i++) {
          addPerformanceMetric({
            serverId: 'server1',
            operation: 'test',
            duration: i,
          });
        }

        const metrics = getPerformanceMetrics();
        expect(metrics).toHaveLength(500);
      });
    });

    describe('getPerformanceMetrics', () => {
      it('should return empty array when no metrics exist', () => {
        const metrics = getPerformanceMetrics();
        expect(metrics).toEqual([]);
      });

      it('should filter metrics by serverId', () => {
        addPerformanceMetric({ serverId: 'server1', operation: 'op1', duration: 100 });
        addPerformanceMetric({ serverId: 'server2', operation: 'op2', duration: 200 });

        const metrics = getPerformanceMetrics('server1');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].serverId).toBe('server1');
      });

      it('should filter metrics by operation', () => {
        addPerformanceMetric({ serverId: 's1', operation: 'tool_call', duration: 100 });
        addPerformanceMetric({ serverId: 's1', operation: 'api_call', duration: 200 });

        const metrics = getPerformanceMetrics(undefined, 'tool_call');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].operation).toBe('tool_call');
      });
    });

    describe('clearPerformanceMetrics', () => {
      it('should clear all metrics', () => {
        addPerformanceMetric({ serverId: 's1', operation: 'op1', duration: 100 });

        clearPerformanceMetrics();

        const metrics = getPerformanceMetrics();
        expect(metrics).toEqual([]);
      });

      it('should clear metrics for specific server', () => {
        addPerformanceMetric({ serverId: 'server1', operation: 'op1', duration: 100 });
        addPerformanceMetric({ serverId: 'server2', operation: 'op2', duration: 200 });

        clearPerformanceMetrics('server1');

        const metrics = getPerformanceMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].serverId).toBe('server2');
      });
    });

    describe('getServerPerformanceStats', () => {
      it('should calculate performance statistics', () => {
        addPerformanceMetric({ serverId: 'server1', operation: 'op1', duration: 100 });
        addPerformanceMetric({ serverId: 'server1', operation: 'op1', duration: 200 });
        addPerformanceMetric({ serverId: 'server1', operation: 'op1', duration: 300 });

        const stats = getServerPerformanceStats('server1');

        expect(stats).toMatchObject({
          serverId: 'server1',
          totalOperations: 3,
          averageDuration: 200,
          minDuration: 100,
          maxDuration: 300,
        });
      });

      it('should calculate stats by operation', () => {
        addPerformanceMetric({ serverId: 's1', operation: 'tool_call', duration: 100 });
        addPerformanceMetric({ serverId: 's1', operation: 'tool_call', duration: 200 });
        addPerformanceMetric({ serverId: 's1', operation: 'api_call', duration: 50 });

        const stats = getServerPerformanceStats('s1', 'tool_call');

        expect(stats.totalOperations).toBe(2);
        expect(stats.averageDuration).toBe(150);
      });

      it('should return null for server with no metrics', () => {
        const stats = getServerPerformanceStats('unknown-server');
        expect(stats).toBeNull();
      });

      it('should include operation breakdown', () => {
        addPerformanceMetric({ serverId: 's1', operation: 'tool_call', duration: 100 });
        addPerformanceMetric({ serverId: 's1', operation: 'tool_call', duration: 200 });
        addPerformanceMetric({ serverId: 's1', operation: 'api_call', duration: 50 });

        const stats = getServerPerformanceStats('s1');

        expect(stats?.byOperation).toEqual({
          tool_call: {
            count: 2,
            averageDuration: 150,
            minDuration: 100,
            maxDuration: 200,
          },
          api_call: {
            count: 1,
            averageDuration: 50,
            minDuration: 50,
            maxDuration: 50,
          },
        });
      });
    });

    describe('measurePerformance', () => {
      it('should measure async function performance', async () => {
        const asyncFn = jest.fn().mockResolvedValue('result');

        const result = await measurePerformance(
          'server1',
          'test_operation',
          asyncFn
        );

        expect(result).toBe('result');
        expect(asyncFn).toHaveBeenCalled();

        const metrics = getPerformanceMetrics('server1', 'test_operation');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
      });

      it('should measure sync function performance', async () => {
        const syncFn = jest.fn().mockReturnValue('sync result');

        const result = await measurePerformance(
          'server1',
          'sync_operation',
          syncFn
        );

        expect(result).toBe('sync result');

        const metrics = getPerformanceMetrics('server1', 'sync_operation');
        expect(metrics).toHaveLength(1);
      });

      it('should propagate errors and still record metric', async () => {
        const errorFn = jest.fn().mockRejectedValue(new Error('Test error'));

        await expect(
          measurePerformance('server1', 'error_operation', errorFn)
        ).rejects.toThrow('Test error');

        const metrics = getPerformanceMetrics('server1', 'error_operation');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].metadata?.error).toBe(true);
      });
    });
  });

  describe('MCP Logging Helpers', () => {
    describe('logMCPRequest', () => {
      it('should log MCP request', () => {
        logMCPRequest('server1', 'tools/call', {
          name: 'test_tool',
          arguments: { param: 'value' },
        });

        const logs = getDebugLogs('server1');
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
          level: 'debug',
          serverId: 'server1',
          message: expect.stringContaining('MCP Request'),
          metadata: {
            method: 'tools/call',
            params: { name: 'test_tool', arguments: { param: 'value' } },
          },
        });
      });

      it('should handle requests without params', () => {
        logMCPRequest('server1', 'tools/list');

        const logs = getDebugLogs('server1');
        expect(logs[0].metadata?.params).toBeUndefined();
      });
    });

    describe('logMCPResponse', () => {
      it('should log MCP response', () => {
        logMCPResponse('server1', 'tools/call', {
          content: [{ type: 'text', text: 'Result' }],
        });

        const logs = getDebugLogs('server1');
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
          level: 'debug',
          serverId: 'server1',
          message: expect.stringContaining('MCP Response'),
          metadata: {
            method: 'tools/call',
            result: { content: [{ type: 'text', text: 'Result' }] },
          },
        });
      });

      it('should log response duration if provided', () => {
        logMCPResponse('server1', 'tools/call', { success: true }, 150);

        const logs = getDebugLogs('server1');
        expect(logs[0].metadata?.duration).toBe(150);

        const metrics = getPerformanceMetrics('server1');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].duration).toBe(150);
      });
    });

    describe('logMCPError', () => {
      it('should log MCP error', () => {
        const error = new Error('Connection failed');

        logMCPError('server1', 'tools/call', error);

        const logs = getDebugLogs('server1', 'error');
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
          level: 'error',
          serverId: 'server1',
          message: expect.stringContaining('MCP Error'),
          metadata: {
            method: 'tools/call',
            error: 'Connection failed',
            stack: expect.any(String),
          },
        });
      });

      it('should handle non-Error objects', () => {
        logMCPError('server1', 'tools/call', 'String error');

        const logs = getDebugLogs('server1', 'error');
        expect(logs[0].metadata?.error).toBe('String error');
      });

      it('should include context if provided', () => {
        const error = new Error('Failed');
        const context = { toolName: 'test_tool', attempt: 2 };

        logMCPError('server1', 'tools/call', error, context);

        const logs = getDebugLogs('server1', 'error');
        expect(logs[0].metadata?.context).toEqual(context);
      });
    });
  });

  describe('SSR Safety', () => {
    it('should handle server-side rendering gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => getDebugLogs()).not.toThrow();
      expect(() => getPerformanceMetrics()).not.toThrow();
      expect(() => addDebugLog({ level: 'info', message: 'test', serverId: 's1' })).not.toThrow();

      global.window = originalWindow;
    });
  });
});

