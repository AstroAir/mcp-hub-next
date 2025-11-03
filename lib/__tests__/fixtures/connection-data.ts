/**
 * Test Fixtures - Connection Data
 * Mock connection states and history for testing
 */

import type {
  MCPConnectionState,
  MCPConnectionHistoryEntry,
  MCPTool,
  MCPResource,
  MCPPrompt,
} from '@/lib/types';

/**
 * Mock MCP tools
 */
export const mockTool: MCPTool = {
  name: 'search_files',
  description: 'Search for files in a directory',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      path: {
        type: 'string',
        description: 'Directory path to search in',
      },
    },
    required: ['query'],
  },
};

export const mockTools: MCPTool[] = [
  mockTool,
  {
    name: 'read_file',
    description: 'Read contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write contents to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path',
        },
        content: {
          type: 'string',
          description: 'File content',
        },
      },
      required: ['path', 'content'],
    },
  },
];

/**
 * Mock MCP resources
 */
export const mockResource: MCPResource = {
  uri: 'file:///home/user/document.txt',
  name: 'document.txt',
  description: 'A text document',
  mimeType: 'text/plain',
};

export const mockResources: MCPResource[] = [
  mockResource,
  {
    uri: 'file:///home/user/image.png',
    name: 'image.png',
    description: 'An image file',
    mimeType: 'image/png',
  },
  {
    uri: 'file:///home/user/data.json',
    name: 'data.json',
    description: 'JSON data file',
    mimeType: 'application/json',
  },
];

/**
 * Mock MCP prompts
 */
export const mockPrompt: MCPPrompt = {
  name: 'code_review',
  description: 'Review code for best practices',
  arguments: [
    {
      name: 'code',
      description: 'Code to review',
      required: true,
    },
    {
      name: 'language',
      description: 'Programming language',
      required: false,
    },
  ],
};

export const mockPrompts: MCPPrompt[] = [
  mockPrompt,
  {
    name: 'summarize',
    description: 'Summarize text',
    arguments: [
      {
        name: 'text',
        description: 'Text to summarize',
        required: true,
      },
    ],
  },
];

/**
 * Mock connected connection state
 */
export const mockConnectedState: MCPConnectionState = {
  serverId: 'stdio-test-server',
  status: 'connected',
  connectedAt: '2024-01-01T10:00:00.000Z',
  errorCount: 0,
  tools: mockTools,
  resources: mockResources,
  prompts: mockPrompts,
};

/**
 * Mock connecting connection state
 */
export const mockConnectingState: MCPConnectionState = {
  serverId: 'sse-test-server',
  status: 'connecting',
  errorCount: 0,
  tools: [],
  resources: [],
  prompts: [],
};

/**
 * Mock disconnected connection state
 */
export const mockDisconnectedState: MCPConnectionState = {
  serverId: 'http-test-server',
  status: 'disconnected',
  errorCount: 0,
  tools: [],
  resources: [],
  prompts: [],
};

/**
 * Mock error connection state
 */
export const mockErrorState: MCPConnectionState = {
  serverId: 'error-server',
  status: 'error',
  error: 'Connection timeout',
  errorCount: 3,
  lastError: '2024-01-01T10:05:00.000Z',
  tools: [],
  resources: [],
  prompts: [],
};

/**
 * Mock connection history entry - successful
 */
export const mockSuccessHistoryEntry: MCPConnectionHistoryEntry = {
  id: 'history-1',
  serverId: 'stdio-test-server',
  serverName: 'Test Stdio Server',
  timestamp: '2024-01-01T10:00:00.000Z',
  success: true,
  duration: 1234,
};

/**
 * Mock connection history entry - failed
 */
export const mockFailedHistoryEntry: MCPConnectionHistoryEntry = {
  id: 'history-2',
  serverId: 'error-server',
  serverName: 'Error Server',
  timestamp: '2024-01-01T10:05:00.000Z',
  success: false,
  error: 'Connection timeout',
  duration: 5000,
};

/**
 * Mock connection history
 */
export const mockConnectionHistory: MCPConnectionHistoryEntry[] = [
  mockSuccessHistoryEntry,
  mockFailedHistoryEntry,
  {
    id: 'history-3',
    serverId: 'sse-test-server',
    serverName: 'Test SSE Server',
    timestamp: '2024-01-01T09:00:00.000Z',
    success: true,
    duration: 856,
  },
];

/**
 * Create a custom connection state
 */
export function createMockConnectionState(
  serverId: string,
  status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'connected',
  overrides: Partial<MCPConnectionState> = {}
): MCPConnectionState {
  const baseState: MCPConnectionState = {
    serverId,
    status,
    errorCount: 0,
    tools: status === 'connected' ? mockTools : [],
    resources: status === 'connected' ? mockResources : [],
    prompts: status === 'connected' ? mockPrompts : [],
  };

  if (status === 'connected') {
    baseState.connectedAt = new Date().toISOString();
  }

  if (status === 'error') {
    baseState.error = 'Connection failed';
    baseState.lastError = new Date().toISOString();
    baseState.errorCount = 1;
  }

  return {
    ...baseState,
    ...overrides,
  };
}

/**
 * Create a custom history entry
 */
export function createMockHistoryEntry(
  serverId: string,
  serverName: string,
  success: boolean = true,
  overrides: Partial<MCPConnectionHistoryEntry> = {}
): MCPConnectionHistoryEntry {
  return {
    id: `history-${Date.now()}`,
    serverId,
    serverName,
    timestamp: new Date().toISOString(),
    success,
    duration: Math.floor(Math.random() * 5000),
    ...overrides,
  };
}

/**
 * Create a custom tool
 */
export function createMockTool(
  name: string,
  description: string,
  inputSchema: unknown = {}
): MCPTool {
  return {
    name,
    description,
    inputSchema: inputSchema || {
      type: 'object',
      properties: {},
    },
  };
}

/**
 * Create a custom resource
 */
export function createMockResource(
  uri: string,
  name: string,
  mimeType: string = 'text/plain'
): MCPResource {
  return {
    uri,
    name,
    description: `Mock resource: ${name}`,
    mimeType,
  };
}

/**
 * Create a custom prompt
 */
export function createMockPrompt(
  name: string,
  description: string,
  args: Array<{ name: string; description: string; required: boolean }> = []
): MCPPrompt {
  return {
    name,
    description,
    arguments: args,
  };
}

