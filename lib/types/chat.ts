/**
 * Chat and AI Integration Types
 */

import type { FileAttachment } from './file-attachment';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ClaudeModel = 
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229';

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
  model: ClaudeModel;
  connectedServers: string[]; // Server IDs
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

