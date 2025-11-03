/**
 * MCP Client Service - Shared utilities for MCP connections
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { getConnectionPool } from './connection-pool';
import { getRateLimiter, type RateLimitOptions } from './rate-limiter';
import type {
  MCPServerConfig,
  StdioMCPServerConfig,
  SSEMCPServerConfig,
  HTTPMCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPConnectionState
} from '@/lib/types';
import {
  addDebugLog,
  logMCPResponse,
  measurePerformance,
} from './debug-logger';

/**
 * HTTP Transport implementation for MCP
 * Implements the Transport interface for HTTP-based communication
 * Enhanced with connection pooling and rate limiting
 */
class HTTPClientTransport implements Transport {
  private url: URL;
  private method: 'GET' | 'POST';
  private headers: Record<string, string>;
  private timeout: number;
  private serverId: string;
  private useConnectionPool: boolean;
  private rateLimitOptions?: RateLimitOptions;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: unknown) => void;

  constructor(
    url: URL,
    options: {
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      timeout?: number;
      serverId?: string;
      useConnectionPool?: boolean;
      rateLimitOptions?: RateLimitOptions;
    } = {}
  ) {
    this.url = url;
    this.method = options.method || 'POST';
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
    this.serverId = options.serverId || 'default';
    this.useConnectionPool = options.useConnectionPool !== false; // Default true
    this.rateLimitOptions = options.rateLimitOptions;
  }

  async start(): Promise<void> {
    // HTTP transport doesn't need persistent connection
    return Promise.resolve();
  }

  async send(message: unknown): Promise<void> {
    try {
      // Check rate limit if configured
      if (this.rateLimitOptions) {
        const limiter = getRateLimiter(this.serverId, this.rateLimitOptions);
        const result = await limiter.checkLimit(this.serverId);

        if (!result.allowed) {
          const error = new Error(
            `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`
          );
          if (this.onerror) {
            this.onerror(error);
          }
          throw error;
        }
      }

      // Acquire connection from pool if enabled
      let pooledConnection;
      if (this.useConnectionPool) {
        const pool = getConnectionPool();
        pooledConnection = await pool.acquire(
          this.serverId,
          this.url.toString(),
          this.headers
        );
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.url.toString(), {
          method: this.method,
          headers: {
            'Content-Type': 'application/json',
            ...this.headers,
          },
          body: JSON.stringify(message),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (this.onmessage) {
          this.onmessage(data);
        }
      } finally {
        // Release connection back to pool
        if (pooledConnection) {
          const pool = getConnectionPool();
          pool.release(pooledConnection.id);
        }
      }
    } catch (error) {
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // Clear connections from pool for this server
    if (this.useConnectionPool) {
      const pool = getConnectionPool();
      pool.clearServer(this.serverId);
    }

    if (this.onclose) {
      this.onclose();
    }
    return Promise.resolve();
  }
}

/**
 * Active MCP client connections
 */
const activeClients = new Map<string, Client>();

/**
 * Create an MCP client for stdio transport
 */
export async function createStdioClient(
  config: StdioMCPServerConfig
): Promise<Client> {
  const client = new Client(
    {
      name: 'mcp-hub-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
    }
  );

  // Filter out undefined values from environment
  const envWithDefaults = config.env
    ? Object.fromEntries(
        Object.entries({ ...process.env, ...config.env })
          .filter(([, value]) => value !== undefined)
      ) as Record<string, string>
    : undefined;

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    env: envWithDefaults,
    stderr: 'pipe', // Capture stderr for logging
  });

  await client.connect(transport);

  return client;
}

/**
 * Create an MCP client for SSE transport
 */
export async function createSSEClient(
  config: SSEMCPServerConfig
): Promise<Client> {
  const client = new Client(
    {
      name: 'mcp-hub-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
    }
  );

  // Note: SSEClientTransport doesn't support custom headers in the constructor
  // Headers would need to be set via EventSource configuration if needed
  const transport = new SSEClientTransport(new URL(config.url));

  await client.connect(transport);

  return client;
}

/**
 * Create an MCP client for HTTP transport
 */
export async function createHTTPClient(
  config: HTTPMCPServerConfig
): Promise<Client> {
  const client = new Client(
    {
      name: 'mcp-hub-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
    }
  );

  const transport = new HTTPClientTransport(
    new URL(config.url),
    {
      method: config.method,
      headers: config.headers,
      timeout: config.timeout || 30000, // Use config timeout or default to 30s
      serverId: config.id,
      useConnectionPool: true,
      rateLimitOptions: {
        maxRequests: 100, // 100 requests
        windowMs: 60000, // per minute
        strategy: 'sliding-window',
      },
    }
  );

  await client.connect(transport);

  return client;
}

/**
 * Get or create MCP client for a server
 */
export async function getOrCreateClient(
  config: MCPServerConfig
): Promise<Client> {
  const existingClient = activeClients.get(config.id);
  if (existingClient) {
    return existingClient;
  }

  let client: Client;

  switch (config.transportType) {
    case 'stdio':
      client = await createStdioClient(config);
      break;
    case 'sse':
      client = await createSSEClient(config);
      break;
    case 'http':
      client = await createHTTPClient(config);
      break;
    default:
      throw new Error(`Unknown transport type: ${(config as MCPServerConfig).transportType}`);
  }

  activeClients.set(config.id, client);
  return client;
}

/**
 * Disconnect and remove client
 */
export async function disconnectClient(serverId: string): Promise<void> {
  const client = activeClients.get(serverId);
  if (client) {
    await client.close();
    activeClients.delete(serverId);
  }
}

/**
 * Get connection state for a server
 */
export async function getConnectionState(
  serverId: string,
  serverName: string,
  client: Client
): Promise<MCPConnectionState> {
  try {
    addDebugLog('info', 'connection', `Getting connection state for ${serverName}`, {
      serverId,
      serverName,
    });

    // List available tools
    const toolsResult = await measurePerformance(
      serverId,
      serverName,
      'listTools',
      () => client.listTools()
    );

    logMCPResponse(serverId, serverName, 'listTools', toolsResult);

    const tools: MCPTool[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as MCPTool['inputSchema'],
    }));

    // List available resources
    let resources: MCPResource[] = [];
    try {
      const resourcesResult = await measurePerformance(
        serverId,
        serverName,
        'listResources',
        () => client.listResources()
      );
      logMCPResponse(serverId, serverName, 'listResources', resourcesResult);
      resources = resourcesResult.resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));
    } catch {
      // Resources might not be supported
      addDebugLog('debug', 'mcp', 'Resources not supported', { serverId, serverName });
    }

    // List available prompts
    let prompts: MCPPrompt[] = [];
    try {
      const promptsResult = await measurePerformance(
        serverId,
        serverName,
        'listPrompts',
        () => client.listPrompts()
      );
      logMCPResponse(serverId, serverName, 'listPrompts', promptsResult);
      prompts = promptsResult.prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments?.map((arg) => ({
          name: arg.name,
          description: arg.description,
          required: arg.required,
        })),
      }));
    } catch {
      // Prompts might not be supported
      addDebugLog('debug', 'mcp', 'Prompts not supported', { serverId, serverName });
    }

    return {
      serverId,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      errorCount: 0,
      tools,
      resources,
      prompts,
    };
  } catch (error) {
    return {
      serverId,
      status: 'error',
      lastError: error instanceof Error ? error.message : 'Unknown error',
      errorCount: 1,
      tools: [],
      resources: [],
      prompts: [],
    };
  }
}

/**
 * Call a tool on an MCP server
 */
export async function callTool(
  serverId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const client = activeClients.get(serverId);
  if (!client) {
    throw new Error(`No active connection for server: ${serverId}`);
  }

  const result = await client.callTool({
    name: toolName,
    arguments: input,
  });

  return result.content;
}

/**
 * Get all active client IDs
 */
/**
 * Get active client by server ID
 */
export function getActiveClient(serverId: string): Client | undefined {
  return activeClients.get(serverId);
}

export function getActiveClientIds(): string[] {
  return Array.from(activeClients.keys());
}

/**
 * Disconnect all clients
 */
export async function disconnectAllClients(): Promise<void> {
  const promises = Array.from(activeClients.keys()).map((id) =>
    disconnectClient(id)
  );
  await Promise.all(promises);
}

