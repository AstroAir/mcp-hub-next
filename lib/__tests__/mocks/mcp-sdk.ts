/**
 * MCP SDK Mocks
 * Mock implementations of @modelcontextprotocol/sdk for testing
 */

import { vi } from 'vitest';

/**
 * Mock MCP Client
 */
export class MockClient {
  connect = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  
  listTools = vi.fn(() =>
    Promise.resolve({
      tools: [
        {
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: {
            type: 'object',
            properties: {
              param1: { type: 'string' },
            },
          },
        },
      ],
    })
  );
  
  listResources = vi.fn(() =>
    Promise.resolve({
      resources: [
        {
          uri: 'file:///test',
          name: 'Test Resource',
          description: 'A test resource',
          mimeType: 'text/plain',
        },
      ],
    })
  );
  
  listPrompts = vi.fn(() =>
    Promise.resolve({
      prompts: [
        {
          name: 'test_prompt',
          description: 'A test prompt',
          arguments: [
            {
              name: 'arg1',
              description: 'First argument',
              required: true,
            },
          ],
        },
      ],
    })
  );
  
  callTool = vi.fn((name: string, args: unknown) =>
    Promise.resolve({
      content: [
        {
          type: 'text',
          text: `Tool ${name} executed with args: ${JSON.stringify(args)}`,
        },
      ],
    })
  );
  
  readResource = vi.fn((uri: string) =>
    Promise.resolve({
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: 'Resource content',
        },
      ],
    })
  );
  
  getPrompt = vi.fn((name: string, args: unknown) =>
    Promise.resolve({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Prompt ${name} with args: ${JSON.stringify(args)}`,
          },
        },
      ],
    })
  );

  setRequestHandler = vi.fn();
  setNotificationHandler = vi.fn();
}

/**
 * Mock StdioClientTransport
 */
export class MockStdioClientTransport {
  constructor(public options: { command: string; args?: string[]; env?: Record<string, string> }) {}
  
  start = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  send = vi.fn(() => Promise.resolve());
  onmessage = null;
  onerror = null;
  onclose = null;
}

/**
 * Mock SSEClientTransport
 */
export class MockSSEClientTransport {
  constructor(public url: URL) {}
  
  start = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  send = vi.fn(() => Promise.resolve());
  onmessage = null;
  onerror = null;
  onclose = null;
}

/**
 * Mock HTTP Transport (custom implementation)
 */
export class MockHTTPTransport {
  constructor(public url: string, public options?: { headers?: Record<string, string> }) {}
  
  start = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  send = vi.fn(() => Promise.resolve());
  request = vi.fn(() =>
    Promise.resolve({
      result: { success: true },
    })
  );
  onmessage = null;
  onerror = null;
  onclose = null;
}

/**
 * Mock MCP Server
 */
export class MockServer {
  connect = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  
  setRequestHandler = vi.fn();
  setNotificationHandler = vi.fn();
  
  sendRequest = vi.fn(() => Promise.resolve({}));
  sendNotification = vi.fn(() => Promise.resolve());
}

/**
 * Mock StdioServerTransport
 */
export class MockStdioServerTransport {
  start = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  send = vi.fn(() => Promise.resolve());
  onmessage = null;
  onerror = null;
  onclose = null;
}

/**
 * Mock the entire MCP SDK
 */
export function mockMCPSDK() {
  vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: MockClient,
  }));
  
  vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: MockStdioClientTransport,
  }));
  
  vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: MockSSEClientTransport,
  }));
  
  vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
    Server: MockServer,
  }));
  
  vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: MockStdioServerTransport,
  }));
}

/**
 * Reset all MCP SDK mocks
 */
export function resetMCPSDKMocks() {
  // Reset Client mocks
  MockClient.prototype.connect.mockClear();
  MockClient.prototype.close.mockClear();
  MockClient.prototype.listTools.mockClear();
  MockClient.prototype.listResources.mockClear();
  MockClient.prototype.listPrompts.mockClear();
  MockClient.prototype.callTool.mockClear();
  MockClient.prototype.readResource.mockClear();
  MockClient.prototype.getPrompt.mockClear();
  
  // Reset Transport mocks
  MockStdioClientTransport.prototype.start.mockClear();
  MockStdioClientTransport.prototype.close.mockClear();
  MockStdioClientTransport.prototype.send.mockClear();
  
  MockSSEClientTransport.prototype.start.mockClear();
  MockSSEClientTransport.prototype.close.mockClear();
  MockSSEClientTransport.prototype.send.mockClear();
  
  MockHTTPTransport.prototype.start.mockClear();
  MockHTTPTransport.prototype.close.mockClear();
  MockHTTPTransport.prototype.send.mockClear();
  MockHTTPTransport.prototype.request.mockClear();
}

/**
 * Create a mock tool result
 */
export function createMockToolResult(toolName: string, result: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
}

/**
 * Create a mock resource
 */
export function createMockResource(uri: string, content: string, mimeType: string = 'text/plain') {
  return {
    uri,
    name: uri.split('/').pop() || 'resource',
    description: `Mock resource at ${uri}`,
    mimeType,
    content,
  };
}

/**
 * Create a mock prompt
 */
export function createMockPrompt(name: string, description: string, args: Array<{ name: string; description: string; required: boolean }> = []) {
  return {
    name,
    description,
    arguments: args,
  };
}

/**
 * Create a mock tool
 */
export function createMockTool(name: string, description: string, inputSchema: unknown = {}) {
  return {
    name,
    description,
    inputSchema: inputSchema || {
      type: 'object',
      properties: {},
    },
  };
}

