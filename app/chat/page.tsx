'use client';

/**
 * Chat Page
 * Chat interface with Claude and MCP tool integration
 */

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSessionSidebar } from '@/components/chat/chat-session-sidebar';
import { useServerStore, useConnectionStore, useChatStore } from '@/lib/stores';
import { useStreamingChat } from '@/lib/hooks/use-streaming-chat';
import type { ClaudeModel } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Zap, ZapOff } from 'lucide-react';

export default function ChatPage() {
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();
  const {
    sessions,
    currentSessionId,
    messages,
    model,
    connectedServers,
    createSession,
    deleteSession,
    renameSession,
    setCurrentSession,
    addMessage,
    setModel,
    toggleServer,
  } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const { isStreaming, streamedContent, sendMessage: sendStreamingMessage, stopStreaming } = useStreamingChat();

  const connectedServersList = servers.filter((s) => connections[s.id]?.status === 'connected');

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('New Chat');
    }
  }, [sessions.length, createSession]);

  const handleExportSession = (sessionId: string) => {
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
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    if (useStreaming) {
      // Use streaming
      const assistantMessageId = nanoid();

      try {
        await sendStreamingMessage(
          [...messages, userMessage],
          connectedServers,
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
      // Use non-streaming (original implementation)
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model,
            connectedServers,
          }),
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
    <div className="flex h-[calc(100vh-4rem)]">
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
        <div className="border-b p-4">
          <div className="container mx-auto">
            <Breadcrumbs items={[{ label: 'Chat' }]} className="mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
              {/* Streaming toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="streaming"
                  checked={useStreaming}
                  onCheckedChange={setUseStreaming}
                />
                <Label htmlFor="streaming" className="flex items-center gap-2 cursor-pointer">
                  {useStreaming ? (
                    <>
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>Streaming</span>
                    </>
                  ) : (
                    <>
                      <ZapOff className="h-4 w-4" />
                      <span>Standard</span>
                    </>
                  )}
                </Label>
              </div>

              {/* Model selector */}
              <Select value={model} onValueChange={(v) => setModel(v as ClaudeModel)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                </SelectContent>
              </Select>

              {/* Connected servers */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Connected:</span>
                {connectedServersList.length === 0 ? (
                  <Badge variant="outline">No servers</Badge>
                ) : (
                  connectedServersList.map((server) => (
                    <Badge
                      key={server.id}
                      variant={connectedServers.includes(server.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleServer(server.id)}
                    >
                      {server.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 container mx-auto">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading || isStreaming}
            streamedContent={isStreaming ? streamedContent : undefined}
            onStopStreaming={isStreaming ? stopStreaming : undefined}
          />
        </div>
      </div>
    </div>
  );
}

