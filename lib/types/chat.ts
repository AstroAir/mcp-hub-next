/**
 * Chat and AI Integration Types
 */

import type { FileAttachment } from './file-attachment';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// Model identifier string (provider-specific model id)
// Examples: 'claude-3-5-sonnet-20241022', 'gpt-4o', 'gpt-3.5-turbo', 'gemini-1.5-pro', 'llama3.1:70b'
export type ModelId = string;

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  attachments?: FileAttachment[];
}

/**
 * Tool call from AI
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  error?: string;
  isError: boolean;
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: ModelId;
  connectedServers: string[]; // Server IDs
  // Optional active server selection for this session; null means auto (use connectedServers)
  activeServerId?: string | null;
  // Whether prompt optimization is enabled for this session
  optimizePrompts?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Streaming chat response
 */
export interface StreamingChatResponse {
  type: 'content' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

