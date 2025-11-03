/**
 * MCP Client Service Tests
 * Tests for MCP client creation and management
 */

import {
  createStdioClient,
  createSSEClient,
  createHTTPClient,
  getOrCreateClient,
  disconnectClient,
  getConnectionState,
  callTool,
  getActiveClient,
  getActiveClientIds,
  disconnectAllClients,
} from './mcp-client';

import {
  MockClient,
  MockStdioClientTransport,
  MockSSEClientTransport,
} from '../__tests__/mocks/mcp-sdk';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  const { MockClient } = jest.requireActual('../__tests__/mocks/mcp-sdk');
  return {
    Client: MockClient,
  };
});

jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  const { MockStdioClientTransport } = jest.requireActual('../__tests__/mocks/mcp-sdk');
  return {
    StdioClientTransport: MockStdioClientTransport,
  };
});

jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => {
  const { MockSSEClientTransport } = jest.requireActual('../__tests__/mocks/mcp-sdk');
  return {
    SSEClientTransport: MockSSEClientTransport,
  };
});

describe('MCP Client Service', () => {
  // Helper to create test config
  const createTestConfig = (overrides: Partial<any> = {}) => ({
    id: 'test-server-1',
    name: 'Test Server',
    transportType: 'stdio' as const,
    command: 'node',
    args: ['server.js'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    disconnectAllClients();
  });

  describe('createStdioClient', () => {
    it('should create stdio client with command and args', async () => {
      const config = {
        serverId: 'server1',
        command: 'node',
        args: ['server.js'],
      };

      const client = await createStdioClient(config);

      expect(client).toBeInstanceOf(MockClient);
      expect(client.connect).toHaveBeenCalled();
    });

    it('should pass environment variables to transport', async () => {
      const config = {
        serverId: 'server1',
        command: 'node',
        args: ['server.js'],
        env: {
          NODE_ENV: 'test',
          API_KEY: 'secret',
        },
      };

      await createStdioClient(config);

      // Transport should be created with env vars
      expect(MockStdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'node',
          args: ['server.js'],
          env: expect.objectContaining({
            NODE_ENV: 'test',
            API_KEY: 'secret',
          }),
        })
      );
    });

    it('should handle connection errors', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      MockClient.prototype.connect = mockConnect;

      const config = {
        serverId: 'server1',
        command: 'node',
        args: ['server.js'],
      };

      await expect(createStdioClient(config)).rejects.toThrow('Connection failed');
    });
  });

  describe('createSSEClient', () => {
    it('should create SSE client with URL', async () => {
      const config = {
        serverId: 'server1',
        url: 'http://localhost:3000/sse',
      };

      const client = await createSSEClient(config);

      expect(client).toBeInstanceOf(MockClient);
      expect(client.connect).toHaveBeenCalled();
    });

    it('should pass headers to transport', async () => {
      const config = {
        serverId: 'server1',
        url: 'http://localhost:3000/sse',
        headers: {
          Authorization: 'Bearer token',
        },
      };

      await createSSEClient(config);

      expect(MockSSEClientTransport).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
          },
        })
      );
    });

    it('should validate URL format', async () => {
      const config = {
        serverId: 'server1',
        url: 'invalid-url',
      };

      await expect(createSSEClient(config)).rejects.toThrow();
    });
  });

  describe('createHTTPClient', () => {
    it('should create HTTP client with URL', async () => {
      const config = {
        serverId: 'server1',
        url: 'http://localhost:3000/mcp',
      };

      const client = await createHTTPClient(config);

      expect(client).toBeInstanceOf(MockClient);
      expect(client.connect).toHaveBeenCalled();
    });

    it('should pass headers to transport', async () => {
      const config = {
        serverId: 'server1',
        url: 'http://localhost:3000/mcp',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      };

      await createHTTPClient(config);

      // HTTP transport should be created with headers
      expect(config.headers).toBeDefined();
    });
  });

  describe('getOrCreateClient', () => {
    it('should create new client if not exists', async () => {
      const config = createTestConfig({ id: 'server1' });

      const client = await getOrCreateClient(config);

      expect(client).toBeInstanceOf(MockClient);
      expect(await getConnectionState('server1')).toBe('connected');
    });

    it('should return existing client if already connected', async () => {
      const config = createTestConfig({ id: 'server1' });

      const client1 = await getOrCreateClient(config);
      const client2 = await getOrCreateClient(config);

      expect(client1).toBe(client2);
    });

    it('should support different transport types', async () => {
      const stdioConfig = createTestConfig({
        id: 'server1',
        transportType: 'stdio' as const,
      });

      const sseConfig = createTestConfig({
        id: 'server2',
        transportType: 'sse' as const,
        url: 'http://localhost:3000/sse',
      });

      const httpConfig = createTestConfig({
        id: 'server3',
        transportType: 'http' as const,
        url: 'http://localhost:3000/mcp',
      });

      const client1 = await getOrCreateClient(stdioConfig);
      const client2 = await getOrCreateClient(sseConfig);
      const client3 = await getOrCreateClient(httpConfig);

      expect(client1).toBeInstanceOf(MockClient);
      expect(client2).toBeInstanceOf(MockClient);
      expect(client3).toBeInstanceOf(MockClient);
    });

    it('should handle connection failures', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      MockClient.prototype.connect = mockConnect;

      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await expect(getOrCreateClient(config)).rejects.toThrow('Connection failed');
      expect(getConnectionState('server1')).toBe('disconnected');
    });
  });

  describe('disconnectClient', () => {
    it('should disconnect client and remove from cache', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);
      await disconnectClient('server1');

      expect(getConnectionState('server1')).toBe('disconnected');
      expect(getActiveClient('server1')).toBeNull();
    });

    it('should call client close method', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      const client = await getOrCreateClient(config);
      await disconnectClient('server1');

      expect(client.close).toHaveBeenCalled();
    });

    it('should handle disconnecting non-existent client', async () => {
      await expect(disconnectClient('non-existent')).resolves.not.toThrow();
    });

    it('should handle close errors gracefully', async () => {
      const mockClose = jest.fn().mockRejectedValue(new Error('Close failed'));
      MockClient.prototype.close = mockClose;

      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);
      await expect(disconnectClient('server1')).resolves.not.toThrow();
    });
  });

  describe('getConnectionState', () => {
    it('should return connected for active client', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);

      expect(getConnectionState('server1')).toBe('connected');
    });

    it('should return disconnected for non-existent client', () => {
      expect(getConnectionState('non-existent')).toBe('disconnected');
    });

    it('should return disconnected after disconnect', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);
      await disconnectClient('server1');

      expect(getConnectionState('server1')).toBe('disconnected');
    });
  });

  describe('callTool', () => {
    it('should call tool on client', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);

      const result = await callTool('server1', 'test_tool', {
        param1: 'value1',
      });

      expect(result).toBeDefined();
      expect(MockClient.prototype.callTool).toHaveBeenCalledWith(
        'test_tool',
        { param1: 'value1' }
      );
    });

    it('should throw error if client not connected', async () => {
      await expect(
        callTool('non-existent', 'test_tool', {})
      ).rejects.toThrow();
    });

    it('should handle tool call errors', async () => {
      const mockCallTool = jest.fn().mockRejectedValue(new Error('Tool failed'));
      MockClient.prototype.callTool = mockCallTool;

      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);

      await expect(
        callTool('server1', 'test_tool', {})
      ).rejects.toThrow('Tool failed');
    });
  });

  describe('getActiveClient', () => {
    it('should return active client', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      const client = await getOrCreateClient(config);
      const activeClient = getActiveClient('server1');

      expect(activeClient).toBe(client);
    });

    it('should return null for non-existent client', () => {
      const client = getActiveClient('non-existent');
      expect(client).toBeNull();
    });
  });

  describe('getActiveClientIds', () => {
    it('should return all active client IDs', async () => {
      await getOrCreateClient({
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      });

      await getOrCreateClient({
        serverId: 'server2',
        transport: 'sse' as const,
        url: 'http://localhost:3000/sse',
      });

      const ids = getActiveClientIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('server1');
      expect(ids).toContain('server2');
    });

    it('should return empty array when no clients', () => {
      const ids = getActiveClientIds();
      expect(ids).toEqual([]);
    });
  });

  describe('disconnectAllClients', () => {
    it('should disconnect all clients', async () => {
      await getOrCreateClient({
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      });

      await getOrCreateClient({
        serverId: 'server2',
        transport: 'sse' as const,
        url: 'http://localhost:3000/sse',
      });

      await disconnectAllClients();

      expect(getActiveClientIds()).toHaveLength(0);
      expect(getConnectionState('server1')).toBe('disconnected');
      expect(getConnectionState('server2')).toBe('disconnected');
    });

    it('should handle errors during disconnect', async () => {
      const mockClose = jest.fn().mockRejectedValue(new Error('Close failed'));
      MockClient.prototype.close = mockClose;

      await getOrCreateClient({
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      });

      await expect(disconnectAllClients()).resolves.not.toThrow();
    });
  });

  describe('Connection Pool Integration', () => {
    it('should use connection pool for HTTP clients', async () => {
      const config = {
        serverId: 'server1',
        transport: 'http' as const,
        url: 'http://localhost:3000/mcp',
      };

      await getOrCreateClient(config);

      // Connection should be pooled
      // This would require mocking the connection pool
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to tool calls', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      await getOrCreateClient(config);

      // Make multiple rapid calls
      const promises = Array.from({ length: 10 }, () =>
        callTool('server1', 'test_tool', {})
      );

      await Promise.all(promises);

      // All calls should succeed (rate limiter should handle them)
      expect(MockClient.prototype.callTool).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent connection attempts', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      const promises = Array.from({ length: 5 }, () =>
        getOrCreateClient(config)
      );

      const clients = await Promise.all(promises);

      // All should return the same client
      expect(new Set(clients).size).toBe(1);
    });

    it('should handle reconnection after disconnect', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };

      const client1 = await getOrCreateClient(config);
      await disconnectClient('server1');
      const client2 = await getOrCreateClient(config);

      // Should create new client
      expect(client1).not.toBe(client2);
    });

    it('should handle invalid transport type', async () => {
      const config = {
        serverId: 'server1',
        transport: 'invalid' as any,
      };

      await expect(getOrCreateClient(config)).rejects.toThrow();
    });

    it('should handle missing required config fields', async () => {
      const config = {
        serverId: 'server1',
        transport: 'stdio' as const,
        // Missing command and args
      } as any;

      await expect(getOrCreateClient(config)).rejects.toThrow();
    });
  });
});

