'use client';

/**
 * Chat Page
 * Chat interface with Claude and MCP tool integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSessionSidebar } from '@/components/chat/chat-session-sidebar';
import { useServerStore, useConnectionStore, useChatStore } from '@/lib/stores';
import { useModelStore } from '@/lib/stores/model-store';
import { useStreamingChat } from '@/lib/hooks/use-streaming-chat';
import type { FileAttachment, ModelId } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Zap, ZapOff, Menu } from 'lucide-react';
import { MCPServerSelector } from '@/components/chat/mcp-server-selector';
import { PromptOptimizationToggle } from '@/components/chat/prompt-optimization-toggle';

export default function ChatPage() {
  const nav = useTranslations('common.navigation');
  const sessionT = useTranslations('chat.session');
  const toastT = useTranslations('chat.toasts');
  const labelT = useTranslations('chat.labels');
  const messageT = useTranslations('chat.messages');

  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();
  const {
    sessions,
    currentSessionId,
    messages,
    model,
    connectedServers,
    activeServerId,
    optimizePrompts,
    createSession,
    deleteSession,
    renameSession,
    setCurrentSession,
    addMessage,
    setModel,
    toggleServer,
    clearMessages,
  } = useChatStore();
  const { models, defaultModelId } = useModelStore();
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isStreaming, streamedContent, sendMessage: sendStreamingMessage, stopStreaming } = useStreamingChat();

  const connectedServersList = servers.filter((s) => connections[s.id]?.status === 'connected');

  const handleExportSession = useCallback((sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const data = {
      session: {
        id: session.id,
        title: session.title,
        messages: session.messages,
        model: session.model,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(toastT('sessionExported'));
  }, [sessions, toastT]);

  useEffect(() => {
    setBreadcrumbs([{ label: nav('chat') }]);
  }, [nav, setBreadcrumbs]);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession(sessionT('defaultTitle'));
    }
  }, [sessions.length, createSession, sessionT]);

  useEffect(() => {
    const handleCommandAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string; model?: ModelId }>;
      const { action, model: newModel } = customEvent.detail;

      switch (action) {
        case 'clear-chat':
          clearMessages();
          toast.success(toastT('chatCleared'));
          break;
        case 'export-chat':
          if (currentSessionId) {
            handleExportSession(currentSessionId);
          }
          break;
        case 'set-model':
          if (newModel) {
            setModel(newModel);
            toast.success(toastT('modelSwitched', { model: newModel }));
          }
          break;
        case 'toggle-streaming':
          setUseStreaming((prev) => {
            const nextValue = !prev;
            toast.success(nextValue ? toastT('streamingEnabled') : toastT('streamingDisabled'));
            return nextValue;
          });
          break;
        case 'new-session':
          createSession(sessionT('defaultTitle'));
          toast.success(toastT('newSession'));
          break;
        case 'view-sessions':
          toast.info(toastT('sessionCount', { count: sessions.length }));
          break;
      }
    };

    window.addEventListener('command-palette-action', handleCommandAction);
    return () => window.removeEventListener('command-palette-action', handleCommandAction);
  }, [clearMessages, currentSessionId, setModel, createSession, sessions.length, handleExportSession, toastT, sessionT]);

  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
      attachments,
    };
    addMessage(userMessage);

    const serversToUse = activeServerId ? [activeServerId] : connectedServers;

    let finalContent = content;
    if (optimizePrompts && content.trim().length > 0) {
      try {
        const resp = await fetch('/api/chat/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, newMessage: content, model }),
        });
        const data = await resp.json();
        if (data?.success && data.data?.optimized) {
          finalContent = data.data.optimized as string;
        }
      } catch {
        // ignore optimization failure and proceed
      }
    }

    if (finalContent !== content) {
      addMessage({
        id: nanoid(),
        role: 'system',
        content: messageT('optimizationNotice'),
        timestamp: new Date().toISOString(),
      });
    }

    if (useStreaming) {
      const assistantMessageId = nanoid();

      try {
        await sendStreamingMessage(
          [...messages, { ...userMessage, content: finalContent }],
          serversToUse,
          model,
          {
            onChunk: () => undefined,
            onComplete: (fullMessage) => {
              addMessage({
                id: assistantMessageId,
                role: 'assistant',
                content: fullMessage,
                timestamp: new Date().toISOString(),
              });
            },
            onError: (error) => {
              if (error.message?.includes('STREAMING_UNSUPPORTED')) {
                void handleNonStreaming(finalContent, serversToUse, userMessage.attachments);
                return;
              }
              toast.error(error.message || toastT('responseFailure'));
            },
            onToolUse: (toolName) => {
              toast.info(toastT('toolUse', { tool: toolName }));
            },
          }
        );
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error(toastT('sendFailure'));
          console.error(error);
        }
      }
    } else {
      await handleNonStreaming(finalContent, serversToUse, userMessage.attachments);
    }
  };

  const handleNonStreaming = async (content: string, serversToUse: string[], attachments?: FileAttachment[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              id: nanoid(),
              role: 'user' as const,
              content,
              timestamp: new Date().toISOString(),
              attachments,
            },
          ],
          model,
          connectedServers: serversToUse,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        addMessage(data.data.message);
        if (data.data.toolCalls && data.data.toolCalls.length > 0) {
          toast.success(toastT('toolExecution', { count: data.data.toolCalls.length }));
        }
      } else {
        toast.error(data.error || toastT('responseFailure'));
      }
    } catch (error) {
      toast.error(toastT('sendFailure'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const chatSessions = sessions.map((s) => ({
    id: s.id,
    name: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: s.messages.length,
  }));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 border-r bg-muted/10 flex-col h-full">
        <ChatSessionSidebar
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSession}
          onCreateSession={() => createSession(sessionT('defaultTitle'))}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onExportSession={handleExportSession}
        />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 sm:w-96 flex flex-col">
          <ChatSessionSidebar
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSession(id);
              setIsMobileSidebarOpen(false);
            }}
            onCreateSession={() => {
              createSession(sessionT('defaultTitle'));
              setIsMobileSidebarOpen(false);
            }}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onExportSession={handleExportSession}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-2 sm:p-3 md:p-4">
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Switch
                    id="streaming"
                    checked={useStreaming}
                    onCheckedChange={setUseStreaming}
                  />
                  <Label htmlFor="streaming" className="flex items-center gap-2 cursor-pointer text-xs md:text-sm">
                    {useStreaming ? (
                      <>
                        <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-500" />
                        <span className="hidden sm:inline">{labelT('streaming')}</span>
                      </>
                    ) : (
                      <>
                        <ZapOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">{labelT('standard')}</span>
                      </>
                    )}
                  </Label>
                </div>

                <Select value={model || (defaultModelId ?? '')} onValueChange={(v) => setModel(v as ModelId)}>
                  <SelectTrigger className="w-[160px] md:w-[200px] text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <MCPServerSelector />

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{labelT('connected')}</span>
                  {connectedServersList.length === 0 ? (
                    <Badge variant="outline" className="text-xs">{labelT('noServers')}</Badge>
                  ) : (
                    connectedServersList.map((server) => (
                      <Badge
                        key={server.id}
                        variant={connectedServers.includes(server.id) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleServer(server.id)}
                      >
                        {server.name}
                      </Badge>
                    ))
                  )}
                </div>

                <PromptOptimizationToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearMessages={clearMessages}
            isLoading={isLoading || isStreaming}
            streamedContent={isStreaming ? streamedContent : undefined}
            onStopStreaming={isStreaming ? stopStreaming : undefined}
          />
        </div>
      </div>
    </div>
  );
}
