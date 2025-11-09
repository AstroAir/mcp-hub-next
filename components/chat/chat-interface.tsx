'use client';

/**
 * ChatInterface Component
 * Enhanced chat interface with messages and input
 */

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import {
  StopCircle,
  Loader2,
  Trash2,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  onClearMessages?: () => void;
  isLoading?: boolean;
  streamedContent?: string;
  onStopStreaming?: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearMessages,
  isLoading,
  streamedContent,
  onStopStreaming,
}: ChatInterfaceProps) {
  const t = useTranslations('chat.interface');
  const commonActions = useTranslations('common.actions');
  const messageT = useTranslations('chat.message');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive or streaming content updates
    scrollToBottom();
  }, [messages, streamedContent]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with clear button */}
      {messages.length > 0 && onClearMessages && (
        <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            <span>{t('messageCount', { count: messages.length })}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Trash2 className="size-4 mr-2" />
                {t('actions.clearChat')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clearDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('clearDialog.description')}
                  <br />
                  {t('clearDialog.warning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{commonActions('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onClearMessages}>
                  {t('clearDialog.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
          {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="flex justify-center">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{t('emptyState.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('emptyState.description')}
                  </p>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary" />
                    <span>{t('emptyState.tips.0')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary" />
                    <span>{t('emptyState.tips.1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary" />
                    <span>{t('emptyState.tips.2')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
              >
                <ChatMessage message={message} />
              </div>
            ))}

            {/* Streaming message */}
            {streamedContent && (
              <div className="flex gap-3 p-4 animate-in fade-in-0 slide-in-from-bottom-4">
                <div className="flex-shrink-0 size-8 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 className="size-4 animate-spin" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{messageT('assistant')}</span>
                    <span className="text-xs text-muted-foreground">{t('status.streaming')}</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {streamedContent}
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1" />
                  </div>
                  {onStopStreaming && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onStopStreaming}
                      className="mt-2"
                    >
                      <StopCircle className="size-4 mr-2" />
                      {t('actions.stopGeneration')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && !streamedContent && (
              <div className="flex gap-3 p-4 animate-in fade-in-0">
                <div className="flex-shrink-0 size-8 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 className="size-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{messageT('assistant')}</div>
                  <div className="text-sm text-muted-foreground">{t('status.thinking')}</div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}

