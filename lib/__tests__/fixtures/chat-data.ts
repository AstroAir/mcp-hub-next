/**
 * Test Fixtures - Chat Data
 * Mock chat sessions and messages for testing
 */

import type { ChatSession, ChatMessage, ModelId } from '@/lib/types';

/**
 * Mock chat messages
 */
export const mockUserMessage: ChatMessage = {
  id: 'msg-user-1',
  role: 'user',
  content: 'Hello, can you help me with something?',
  timestamp: '2024-01-01T10:00:00.000Z',
};

export const mockAssistantMessage: ChatMessage = {
  id: 'msg-assistant-1',
  role: 'assistant',
  content: 'Of course! I\'d be happy to help. What do you need assistance with?',
  timestamp: '2024-01-01T10:00:05.000Z',
};

export const mockToolUseMessage: ChatMessage = {
  id: 'msg-tool-use-1',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Let me check that for you.',
    },
    {
      type: 'tool_use',
      id: 'tool-call-1',
      name: 'search_files',
      input: {
        query: 'test',
        path: '/home/user',
      },
    },
  ],
  timestamp: '2024-01-01T10:01:00.000Z',
};

export const mockToolResultMessage: ChatMessage = {
  id: 'msg-tool-result-1',
  role: 'user',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'tool-call-1',
      content: 'Found 3 files matching "test"',
    },
  ],
  timestamp: '2024-01-01T10:01:05.000Z',
};

export const mockErrorMessage: ChatMessage = {
  id: 'msg-error-1',
  role: 'assistant',
  content: 'I apologize, but I encountered an error while processing your request.',
  timestamp: '2024-01-01T10:02:00.000Z',
  error: {
    message: 'Connection timeout',
    code: 'TIMEOUT',
  },
};

/**
 * Mock chat session
 */
export const mockChatSession: ChatSession = {
  id: 'session-1',
  title: 'Test Chat Session',
  messages: [
    mockUserMessage,
    mockAssistantMessage,
  ],
  model: 'claude-3-5-sonnet-20241022',
  connectedServers: ['stdio-test-server'],
  createdAt: '2024-01-01T09:00:00.000Z',
  updatedAt: '2024-01-01T10:00:05.000Z',
};

/**
 * Mock chat session with tool use
 */
export const mockChatSessionWithTools: ChatSession = {
  id: 'session-2',
  title: 'Chat with Tools',
  messages: [
    mockUserMessage,
    mockToolUseMessage,
    mockToolResultMessage,
    mockAssistantMessage,
  ],
  model: 'claude-3-5-sonnet-20241022',
  connectedServers: ['stdio-test-server', 'http-test-server'],
  createdAt: '2024-01-01T09:00:00.000Z',
  updatedAt: '2024-01-01T10:01:05.000Z',
};

/**
 * Mock empty chat session
 */
export const mockEmptyChatSession: ChatSession = {
  id: 'session-empty',
  title: 'New Chat',
  messages: [],
  model: 'claude-3-5-sonnet-20241022',
  connectedServers: [],
  createdAt: '2024-01-01T09:00:00.000Z',
  updatedAt: '2024-01-01T09:00:00.000Z',
};

/**
 * Array of all mock sessions
 */
export const mockChatSessions: ChatSession[] = [
  mockChatSession,
  mockChatSessionWithTools,
  mockEmptyChatSession,
];

/**
 * Create a custom chat message
 */
export function createMockMessage(
  role: 'user' | 'assistant',
  content: string,
  overrides: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: `msg-${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a custom chat session
 */
export function createMockSession(
  title: string = 'Test Session',
  messages: ChatMessage[] = [],
  overrides: Partial<ChatSession> = {}
): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title,
    messages,
    model: 'claude-3-5-sonnet-20241022',
    connectedServers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a tool use message
 */
export function createToolUseMessage(
  toolName: string,
  toolInput: unknown,
  overrides: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: `msg-tool-${Date.now()}`,
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: `tool-call-${Date.now()}`,
        name: toolName,
        input: toolInput,
      },
    ],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a tool result message
 */
export function createToolResultMessage(
  toolUseId: string,
  result: string,
  overrides: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: `msg-result-${Date.now()}`,
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: result,
      },
    ],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a streaming message chunk
 */
export function createStreamingChunk(
  content: string,
  isComplete: boolean = false
): { content: string; isComplete: boolean } {
  return {
    content,
    isComplete,
  };
}

/**
 * Mock Claude models
 */
export const mockClaudeModels: ModelId[] = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
];

/**
 * Create a conversation with multiple turns
 */
export function createMockConversation(turns: number = 3): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  for (let i = 0; i < turns; i++) {
    messages.push(
      createMockMessage('user', `User message ${i + 1}`),
      createMockMessage('assistant', `Assistant response ${i + 1}`)
    );
  }
  
  return messages;
}

/**
 * Create a long message (for testing truncation)
 */
export function createLongMessage(length: number = 10000): ChatMessage {
  return createMockMessage(
    'assistant',
    'A'.repeat(length)
  );
}

/**
 * Create a message with markdown
 */
export function createMarkdownMessage(): ChatMessage {
  return createMockMessage(
    'assistant',
    `# Heading\n\n**Bold text** and *italic text*\n\n\`\`\`javascript\nconst x = 42;\n\`\`\``
  );
}

/**
 * Create a message with code blocks
 */
export function createCodeBlockMessage(language: string = 'javascript', code: string = 'const x = 42;'): ChatMessage {
  return createMockMessage(
    'assistant',
    `Here's some ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
  );
}

