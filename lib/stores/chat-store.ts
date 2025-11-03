/**
 * Chat Store - Manages chat sessions and messages
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ChatStoreState, ChatSession, ChatMessage, ClaudeModel } from '@/lib/types';

const SESSIONS_STORAGE_KEY = 'mcp-chat-sessions';
const CURRENT_SESSION_KEY = 'mcp-current-session';

export const useChatStore = create<ChatStoreState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  model: 'claude-3-5-sonnet-20241022',
  connectedServers: [],
  isStreaming: false,

  createSession: (title?: string) => {
    const sessionId = nanoid();
    const newSession: ChatSession = {
      id: sessionId,
      title: title || `Chat ${new Date().toLocaleString()}`,
      messages: [],
      model: get().model,
      connectedServers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: [...state.sessions, newSession],
      currentSessionId: sessionId,
      messages: [],
      connectedServers: [],
    }));

    get().saveSessions();
    return sessionId;
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== sessionId);
      const newCurrentId =
        state.currentSessionId === sessionId
          ? newSessions[0]?.id || null
          : state.currentSessionId;

      return {
        sessions: newSessions,
        currentSessionId: newCurrentId,
        messages: newCurrentId
          ? newSessions.find((s) => s.id === newCurrentId)?.messages || []
          : [],
      };
    });
    get().saveSessions();
  },

  renameSession: (sessionId: string, newTitle: string) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, title: newTitle, updatedAt: new Date().toISOString() }
          : session
      ),
    }));
    get().saveSessions();
  },

  setCurrentSession: (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (session) {
      set({
        currentSessionId: sessionId,
        messages: session.messages,
        model: session.model,
        connectedServers: session.connectedServers,
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      }
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      const updatedSessions = state.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, messages: newMessages, updatedAt: new Date().toISOString() }
          : session
      );

      return {
        messages: newMessages,
        sessions: updatedSessions,
      };
    });
    get().saveSessions();
  },

  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    set((state) => {
      const newMessages = state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      const updatedSessions = state.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, messages: newMessages, updatedAt: new Date().toISOString() }
          : session
      );

      return {
        messages: newMessages,
        sessions: updatedSessions,
      };
    });
    get().saveSessions();
  },

  setModel: (model: ClaudeModel) => {
    set((state) => {
      const updatedSessions = state.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, model, updatedAt: new Date().toISOString() }
          : session
      );

      return {
        model,
        sessions: updatedSessions,
      };
    });
    get().saveSessions();
  },

  toggleServer: (serverId: string) => {
    set((state) => {
      const newConnectedServers = state.connectedServers.includes(serverId)
        ? state.connectedServers.filter((id) => id !== serverId)
        : [...state.connectedServers, serverId];

      const updatedSessions = state.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, connectedServers: newConnectedServers, updatedAt: new Date().toISOString() }
          : session
      );

      return {
        connectedServers: newConnectedServers,
        sessions: updatedSessions,
      };
    });
    get().saveSessions();
  },

  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

  clearMessages: () => {
    set((state) => {
      const updatedSessions = state.sessions.map((session) =>
        session.id === state.currentSessionId
          ? { ...session, messages: [], updatedAt: new Date().toISOString() }
          : session
      );

      return {
        messages: [],
        sessions: updatedSessions,
      };
    });
    get().saveSessions();
  },

  loadSessions: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY);

      if (stored) {
        const sessions = JSON.parse(stored) as ChatSession[];
        const validCurrentId = currentSessionId && sessions.find((s) => s.id === currentSessionId)
          ? currentSessionId
          : sessions[0]?.id || null;

        const currentSession = sessions.find((s) => s.id === validCurrentId);

        set({
          sessions,
          currentSessionId: validCurrentId,
          messages: currentSession?.messages || [],
          model: currentSession?.model || 'claude-3-5-sonnet-20241022',
          connectedServers: currentSession?.connectedServers || [],
        });
      }
    } catch (error) {
      console.error('Failed to load chat sessions from localStorage:', error);
    }
  },

  saveSessions: () => {
    if (typeof window === 'undefined') return;

    try {
      const { sessions } = get();
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions to localStorage:', error);
    }
  },
}));

// Initialize store on client side
if (typeof window !== 'undefined') {
  useChatStore.getState().loadSessions();
}

