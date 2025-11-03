/**
 * Test Fixtures - Server Configurations
 * Mock server configurations for testing
 */

import type {
  MCPServerConfig,
  StdioMCPServerConfig,
  SSEMCPServerConfig,
  HTTPMCPServerConfig,
} from '@/lib/types';

/**
 * Mock stdio server configuration
 */
export const mockStdioServer: StdioMCPServerConfig = {
  id: 'stdio-test-server',
  name: 'Test Stdio Server',
  transportType: 'stdio',
  command: 'node',
  args: ['server.js'],
  env: {
    NODE_ENV: 'test',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock SSE server configuration
 */
export const mockSSEServer: SSEMCPServerConfig = {
  id: 'sse-test-server',
  name: 'Test SSE Server',
  transportType: 'sse',
  url: 'https://example.com/sse',
  authType: 'bearer',
  bearerToken: 'test-token-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock HTTP server configuration with Bearer auth
 */
export const mockHTTPServerBearer: HTTPMCPServerConfig = {
  id: 'http-test-server-bearer',
  name: 'Test HTTP Server (Bearer)',
  transportType: 'http',
  url: 'https://api.example.com',
  authType: 'bearer',
  bearerToken: 'test-bearer-token',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock HTTP server configuration with API Key auth
 */
export const mockHTTPServerApiKey: HTTPMCPServerConfig = {
  id: 'http-test-server-apikey',
  name: 'Test HTTP Server (API Key)',
  transportType: 'http',
  url: 'https://api.example.com',
  authType: 'apiKey',
  apiKey: 'test-api-key-123',
  apiKeyHeader: 'X-API-Key',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock HTTP server configuration with Basic auth
 */
export const mockHTTPServerBasic: HTTPMCPServerConfig = {
  id: 'http-test-server-basic',
  name: 'Test HTTP Server (Basic)',
  transportType: 'http',
  url: 'https://api.example.com',
  authType: 'basic',
  username: 'testuser',
  password: 'testpass',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock HTTP server configuration with OAuth
 */
export const mockHTTPServerOAuth: HTTPMCPServerConfig = {
  id: 'http-test-server-oauth',
  name: 'Test HTTP Server (OAuth)',
  transportType: 'http',
  url: 'https://api.example.com',
  authType: 'oauth',
  oauthConfig: {
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/oauth/callback',
    scope: 'read write',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock HTTP server configuration with no auth
 */
export const mockHTTPServerNoAuth: HTTPMCPServerConfig = {
  id: 'http-test-server-noauth',
  name: 'Test HTTP Server (No Auth)',
  transportType: 'http',
  url: 'https://api.example.com',
  authType: 'none',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Array of all mock servers
 */
export const mockServers: MCPServerConfig[] = [
  mockStdioServer,
  mockSSEServer,
  mockHTTPServerBearer,
  mockHTTPServerApiKey,
  mockHTTPServerBasic,
  mockHTTPServerOAuth,
  mockHTTPServerNoAuth,
];

/**
 * Create a custom stdio server config
 */
export function createMockStdioServer(overrides: Partial<StdioMCPServerConfig> = {}): StdioMCPServerConfig {
  return {
    ...mockStdioServer,
    id: `stdio-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Create a custom SSE server config
 */
export function createMockSSEServer(overrides: Partial<SSEMCPServerConfig> = {}): SSEMCPServerConfig {
  return {
    ...mockSSEServer,
    id: `sse-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Create a custom HTTP server config
 */
export function createMockHTTPServer(overrides: Partial<HTTPMCPServerConfig> = {}): HTTPMCPServerConfig {
  return {
    ...mockHTTPServerBearer,
    id: `http-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Create a minimal server config
 */
export function createMinimalServer(transportType: 'stdio' | 'sse' | 'http' = 'stdio'): MCPServerConfig {
  const baseConfig = {
    id: `minimal-${transportType}-${Date.now()}`,
    name: `Minimal ${transportType.toUpperCase()} Server`,
    transportType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  switch (transportType) {
    case 'stdio':
      return {
        ...baseConfig,
        transportType: 'stdio',
        command: 'node',
        args: ['server.js'],
      } as StdioMCPServerConfig;
    
    case 'sse':
      return {
        ...baseConfig,
        transportType: 'sse',
        url: 'https://example.com/sse',
        authType: 'none',
      } as SSEMCPServerConfig;
    
    case 'http':
      return {
        ...baseConfig,
        transportType: 'http',
        url: 'https://api.example.com',
        authType: 'none',
      } as HTTPMCPServerConfig;
  }
}

/**
 * Create an invalid server config (for error testing)
 */
export function createInvalidServer(): Partial<MCPServerConfig> {
  return {
    id: 'invalid-server',
    name: '',
    // Missing required fields
  };
}

