'use client';

/**
 * ChatMessage Component
 * Displays a single chat message
 */

import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { User, Bot } from 'lucide-react';
import { CodeBlock } from './code-block';

// Helper function to parse markdown code blocks
function parseMessageContent(content: string) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add code block
    parts.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'text',
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const contentParts = parseMessageContent(message.content);

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-muted/50' : 'bg-background')}>
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-sm font-medium">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="text-sm space-y-2">
          {contentParts.map((part, index) => (
            part.type === 'code' ? (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language}
              />
            ) : (
              <div key={index} className="whitespace-pre-wrap">{part.content}</div>
            )
          ))}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <div key={toolCall.id} className="text-xs bg-muted p-2 rounded border">
                <div className="font-medium">Tool: {toolCall.name}</div>
                <div className="text-muted-foreground mt-1">
                  Input: {JSON.stringify(toolCall.input, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolResults.map((result) => (
              <div key={result.toolCallId} className={cn('text-xs p-2 rounded border', result.isError ? 'bg-destructive/10 border-destructive' : 'bg-muted')}>
                <div className="font-medium">Result: {result.toolName}</div>
                {result.isError ? (
                  <div className="text-destructive mt-1">Error: {result.error}</div>
                ) : (
                  <div className="text-muted-foreground mt-1">
                    {JSON.stringify(result.result, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

