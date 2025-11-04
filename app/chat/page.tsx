'use client';

/**
 * Chat Page
 * Chat interface with Claude and MCP tool integration
 */

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSessionSidebar } from '@/components/chat/chat-session-sidebar';
import { useServerStore, useConnectionStore, useChatStore } from '@/lib/stores';
import { useModelStore } from '@/lib/stores/model-store';
import { useStreamingChat } from '@/lib/hooks/use-streaming-chat';
import type { ModelId } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Zap, ZapOff } from 'lucide-react';
import { MCPServerSelector } from '@/components/chat/mcp-server-selector';
import { PromptOptimizationToggle } from '@/components/chat/prompt-optimization-toggle';

export default function ChatPage() {
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
    toast.success('Chat session exported');
  }, [sessions]);

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: 'Chat' }]);
  }, [setBreadcrumbs]);

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('New Chat');
    }
  }, [sessions.length, createSession]);

  // Listen for command palette actions
  useEffect(() => {
    const handleCommandAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string; model?: ModelId }>;
      const { action, model: newModel } = customEvent.detail;

      switch (action) {
        case 'clear-chat':
          clearMessages();
          toast.success('Chat cleared');
          break;
        case 'export-chat':
          if (currentSessionId) {
            handleExportSession(currentSessionId);
          }
          break;
        case 'set-model':
          if (newModel) {
            setModel(newModel);
            toast.success(`Switched to ${newModel}`);
          }
          break;
        case 'toggle-streaming':
          setUseStreaming((prev) => {
            const newValue = !prev;
            toast.success(`Streaming ${newValue ? 'enabled' : 'disabled'}`);
            return newValue;
          });
          break;
        case 'new-session':
          createSession('New Chat');
          toast.success('New chat session created');
          break;
        case 'view-sessions':
          // This could open a modal or sidebar - for now just show a toast
          toast.info(`You have ${sessions.length} chat session${sessions.length !== 1 ? 's' : ''}`);
          break;
      }
    };

    window.addEventListener('command-palette-action', handleCommandAction);
    return () => window.removeEventListener('command-palette-action', handleCommandAction);
  }, [clearMessages, currentSessionId, setModel, createSession, sessions.length, handleExportSession]);

  

  const handleSendMessage = async (content: string, attachments?: import('@/lib/types').FileAttachment[]) => {
    // Add user message
    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
      attachments,
    };
    addMessage(userMessage);

    // Determine which servers to use
    const serversToUse = activeServerId ? [activeServerId] : connectedServers;

    // Optional prompt optimization
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
        // Ignore optimization failure and proceed
      }
    }

    // If optimized content differs, update the just-added message content for consistency
    if (finalContent !== content) {
      addMessage({
        id: nanoid(),
        role: 'system',
        content: 'Applied prompt optimization to your message.',
        timestamp: new Date().toISOString(),
      });
      // Also replace the last user message content for history coherence
    }

    if (useStreaming) {
      // Use streaming
      const assistantMessageId = nanoid();

      try {
        await sendStreamingMessage(
          [...messages, { ...userMessage, content: finalContent }],
          serversToUse,
          model,
          {
            onChunk: () => {
              // Update the streaming message in real-time
              // This will be handled by the ChatInterface component
            },
            onComplete: (fullMessage) => {
              // Add the complete assistant message
              addMessage({
                id: assistantMessageId,
                role: 'assistant',
                content: fullMessage,
                timestamp: new Date().toISOString(),
              });
            },
            onError: (error) => {
              if (error.message?.includes('STREAMING_UNSUPPORTED')) {
                // Fallback to non-streaming
                void handleNonStreaming(finalContent, serversToUse, userMessage.attachments);
                return;
              }
              toast.error(error.message || 'Failed to get response');
            },
            onToolUse: (toolName) => {
              toast.info(`Using tool: ${toolName}`);
            },
          }
        );
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Failed to send message');
          console.error(error);
        }
      }
    } else {
      await handleNonStreaming(finalContent, serversToUse, userMessage.attachments);
    }
  };

  const handleNonStreaming = async (content: string, serversToUse: string[], attachments?: import('@/lib/types').FileAttachment[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { id: nanoid(), role: 'user' as const, content, timestamp: new Date().toISOString(), attachments }], model, connectedServers: serversToUse }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        addMessage(data.data.message);
        if (data.data.toolCalls && data.data.toolCalls.length > 0) {
          toast.success(`Executed ${data.data.toolCalls.length} tool(s)`);
        }
      } else {
        toast.error(data.error || 'Failed to get response');
      }
    } catch (error) {
      toast.error('Failed to send message');
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
      {/* Session Sidebar */}
      <ChatSessionSidebar
        sessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSession}
        onCreateSession={() => createSession('New Chat')}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onExportSession={handleExportSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-3 md:p-4">
          <div className="w-full px-3 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
              {/* Streaming toggle */}
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
                      <span className="hidden sm:inline">Streaming</span>
                    </>
                  ) : (
                    <>
                      <ZapOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Standard</span>
                    </>
                  )}
                </Label>
              </div>

              {/* Model selector */}
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

              {/* MCP server selector */}
              <MCPServerSelector />

              {/* Connected servers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Connected:</span>
                {connectedServersList.length === 0 ? (
                  <Badge variant="outline" className="text-xs">No servers</Badge>
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
              {/* Prompt optimization toggle */}
              <PromptOptimizationToggle />
            </div>
          </div>
        </div>
        </div>

        {/* Chat interface */}
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

