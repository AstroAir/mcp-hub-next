'use client';

/**
 * ChatInterface Component
 * Complete chat interface with messages and input
 */

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { StopCircle, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamedContent?: string;
  onStopStreaming?: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  streamedContent,
  onStopStreaming,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive or streaming content updates
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {streamedContent && (
              <div className="flex gap-3 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Assistant</span>
                    <span className="text-xs text-muted-foreground">Streaming...</span>
                  </div>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {streamedContent}
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  </div>
                  {onStopStreaming && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onStopStreaming}
                      className="mt-2"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Generation
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {isLoading && !streamedContent && (
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Assistant</div>
              <div className="text-sm text-muted-foreground">Thinking...</div>
            </div>
          </div>
        )}
      </ScrollArea>
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}

