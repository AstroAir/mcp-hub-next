'use client';

/**
 * ChatSessionSidebar Component
 * Sidebar for managing chat sessions
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onExportSession: (sessionId: string) => void;
}

export function ChatSessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onExportSession,
}: ChatSessionSidebarProps) {
  const t = useTranslations('chat.sidebar');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editName.trim()) {
      onRenameSession(sessionId, editName.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (sessionId: string) => {
    if (confirm(t('confirmDelete'))) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <>
      <div className="p-4 border-b">
        <Button onClick={onCreateSession} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('newChat')}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              {t('empty')}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group rounded-lg p-2 hover:bg-muted/50 transition-colors',
                  currentSessionId === session.id && 'bg-muted'
                )}
              >
                {editingId === session.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(session.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-9 sm:h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 sm:h-7 sm:w-7"
                      onClick={() => handleSaveEdit(session.id)}
                    >
                      <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 sm:h-7 sm:w-7"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex items-start gap-2 cursor-pointer"
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('messageCount', { count: session.messageCount })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 sm:h-6 sm:w-6"
                        onClick={() => handleStartEdit(session)}
                      >
                        <Edit2 className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 sm:h-6 sm:w-6"
                        onClick={() => onExportSession(session.id)}
                      >
                        <Download className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 sm:h-6 sm:w-6 text-destructive"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

