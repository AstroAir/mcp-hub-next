/**
 * useStreamingChat Hook
 * Handles streaming chat responses from Claude API
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';

interface StreamingChatOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
  onToolUse?: (toolName: string, toolInput: unknown) => void;
  onToolResult?: (toolName: string, result: unknown) => void;
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      connectedServers: string[],
      model: string,
      options: StreamingChatOptions = {}
    ): Promise<string> => {
      setIsStreaming(true);
      setStreamedContent('');

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            connectedServers,
            model,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              try {
                const event = JSON.parse(data);

                if (event.type === 'content_block_delta') {
                  if (event.data.delta?.type === 'text_delta') {
                    const chunk = event.data.delta.text;
                    fullContent += chunk;
                    setStreamedContent(fullContent);
                    options.onChunk?.(chunk);
                  }
                } else if (event.type === 'content_block_start') {
                  if (event.data.content_block?.type === 'tool_use') {
                    options.onToolUse?.(
                      event.data.content_block.name,
                      event.data.content_block.input
                    );
                  }
                } else if (event.type === 'tool_result') {
                  options.onToolResult?.(
                    event.data.tool_use_id,
                    event.data.content
                  );
                } else if (event.type === 'complete') {
                  options.onComplete?.(fullContent);
                } else if (event.type === 'error') {
                  throw new Error(event.data.error);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError);
              }
            }
          }
        }

        setIsStreaming(false);
        return fullContent;
      } catch (error) {
        setIsStreaming(false);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.log('Stream aborted by user');
            return streamedContent;
          }
          options.onError?.(error);
          throw error;
        }
        
        const unknownError = new Error('Unknown error occurred');
        options.onError?.(unknownError);
        throw unknownError;
      }
    },
    [streamedContent]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStreamedContent('');
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, []);

  return {
    isStreaming,
    streamedContent,
    sendMessage,
    stopStreaming,
    reset,
  };
}

