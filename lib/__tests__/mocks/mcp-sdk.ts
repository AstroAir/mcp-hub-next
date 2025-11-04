/**
 * MCP SDK Mocks
 * Mock implementations of @modelcontextprotocol/sdk for testing
 */

/**
 * Mock MCP Client
 */
export class MockClient {
  connect(): Promise<void> { return Promise.resolve(); }
  close(): Promise<void> { return Promise.resolve(); }

  listTools(): Promise<any> { return Promise.resolve({ tools: [{ name: 'test_tool', description: 'A test tool', inputSchema: { type: 'object', properties: { param1: { type: 'string' } } } }] }); }

  listResources(): Promise<any> { return Promise.resolve({ resources: [{ uri: 'file:///test', name: 'Test Resource', description: 'A test resource', mimeType: 'text/plain' }] }); }

  listPrompts(): Promise<any> { return Promise.resolve({ prompts: [{ name: 'test_prompt', description: 'A test prompt', arguments: [{ name: 'arg1', description: 'First argument', required: true }] }] }); }

  callTool(name: string, args: unknown): Promise<any> { return Promise.resolve({ content: [{ type: 'text', text: `Tool ${name} executed with args: ${JSON.stringify(args)}` }] }); }

  readResource(uri: string): Promise<any> { return Promise.resolve({ contents: [{ uri, mimeType: 'text/plain', text: 'Resource content' }] }); }

  getPrompt(name: string, args: unknown): Promise<any> { return Promise.resolve({ messages: [{ role: 'user', content: { type: 'text', text: `Prompt ${name} with args: ${JSON.stringify(args)}` } }] }); }

  setRequestHandler(): void { /* noop */ }
  setNotificationHandler(): void { /* noop */ }
}

// Replace prototype methods with jest.fn so tests can spy/override
(MockClient.prototype.connect as any) = jest.fn(() => Promise.resolve());
(MockClient.prototype.close as any) = jest.fn(() => Promise.resolve());
(MockClient.prototype.listTools as any) = jest.fn(() => Promise.resolve({
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
}));
(MockClient.prototype.listResources as any) = jest.fn(() => Promise.resolve({
  resources: [
    {
      uri: 'file:///test',
      name: 'Test Resource',
      description: 'A test resource',
      mimeType: 'text/plain',
    },
  ],
}));
(MockClient.prototype.listPrompts as any) = jest.fn(() => Promise.resolve({
  prompts: [
    {
      name: 'test_prompt',
      description: 'A test prompt',
      arguments: [
        { name: 'arg1', description: 'First argument', required: true },
      ],
    },
  ],
}));
(MockClient.prototype.callTool as any) = jest.fn((name: string, args: unknown) => Promise.resolve({ content: [ { type: 'text', text: `Tool ${name} executed with args: ${JSON.stringify(args)}` } ] }));
(MockClient.prototype.readResource as any) = jest.fn((uri: string) => Promise.resolve({ contents: [ { uri, mimeType: 'text/plain', text: 'Resource content' } ] }));
(MockClient.prototype.getPrompt as any) = jest.fn((name: string, args: unknown) => Promise.resolve({ messages: [ { role: 'user', content: { type: 'text', text: `Prompt ${name} with args: ${JSON.stringify(args)}` } } ] }));
(MockClient.prototype.setRequestHandler as any) = jest.fn();
(MockClient.prototype.setNotificationHandler as any) = jest.fn();

/**
 * Mock StdioClientTransport
 */
export const MockStdioClientTransport = jest.fn(function MockStdioClientTransport(this: any, options: { command: string; args?: string[]; env?: Record<string, string> }) {
  this.options = options;
  this.start = jest.fn(() => Promise.resolve());
  this.close = jest.fn(() => Promise.resolve());
  this.send = jest.fn(() => Promise.resolve());
  this.onmessage = null;
  this.onerror = null;
  this.onclose = null;
});

/**
 * Mock SSEClientTransport
 */
export const MockSSEClientTransport = jest.fn(function MockSSEClientTransport(this: any, url: URL, options?: { headers?: Record<string, string> }) {
  this.url = url;
  this.options = options;
  this.start = jest.fn(() => Promise.resolve());
  this.close = jest.fn(() => Promise.resolve());
  this.send = jest.fn(() => Promise.resolve());
  this.onmessage = null;
  this.onerror = null;
  this.onclose = null;
});

/**
 * Mock HTTP Transport (custom implementation)
 */
export class MockHTTPTransport {
  constructor(public url: string, public options?: { headers?: Record<string, string> }) {}

  start = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
  send = jest.fn(() => Promise.resolve());
  request = jest.fn(() =>
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
  connect = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());

  setRequestHandler = jest.fn();
  setNotificationHandler = jest.fn();

  sendRequest = jest.fn(() => Promise.resolve({}));
  sendNotification = jest.fn(() => Promise.resolve());
}

/**
 * Mock StdioServerTransport
 */
export class MockStdioServerTransport {
  start = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
  send = jest.fn(() => Promise.resolve());
  onmessage = null;
  onerror = null;
  onclose = null;
}

/**
 * Mock the entire MCP SDK
 */
export function mockMCPSDK() {
  jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: MockClient,
  }));

  jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: MockStdioClientTransport,
  }));

  jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: MockSSEClientTransport,
  }));

  jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
    Server: MockServer,
  }));

  jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: MockStdioServerTransport,
  }));
}

/**
 * Reset all MCP SDK mocks
 */
export function resetMCPSDKMocks() {
  // Reset Client mocks
  (MockClient.prototype.connect as unknown as jest.Mock).mockClear();
  (MockClient.prototype.close as unknown as jest.Mock).mockClear();
  (MockClient.prototype.listTools as unknown as jest.Mock).mockClear();
  (MockClient.prototype.listResources as unknown as jest.Mock).mockClear();
  (MockClient.prototype.listPrompts as unknown as jest.Mock).mockClear();
  (MockClient.prototype.callTool as unknown as jest.Mock).mockClear();
  (MockClient.prototype.readResource as unknown as jest.Mock).mockClear();
  (MockClient.prototype.getPrompt as unknown as jest.Mock).mockClear();
  
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

