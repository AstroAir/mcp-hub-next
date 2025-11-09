/**
 * Connection Store - Manages active MCP connections and history
 */

import { create } from 'zustand';
import type { 
  ConnectionStoreState, 
  MCPConnectionState, 
  MCPConnectionHistoryEntry 
} from '@/lib/types';

const HISTORY_STORAGE_KEY = 'mcp-connection-history';
const MAX_HISTORY_ENTRIES = 100;

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  connections: {},
  history: [],

  setConnectionState: (serverId: string, state: MCPConnectionState) => {
    set((prevState) => ({
      connections: {
        ...prevState.connections,
        [serverId]: state,
      },
    }));
  },

  removeConnection: (serverId: string) => {
    set((state) => {
      const rest = { ...state.connections };
      delete rest[serverId];
      return { connections: rest };
    });
  },

  getConnection: (serverId: string) => {
    return get().connections[serverId];
  },

  addHistoryEntry: (entry: MCPConnectionHistoryEntry) => {
    set((state) => {
      const newHistory = [entry, ...state.history].slice(0, MAX_HISTORY_ENTRIES);
      return { history: newHistory };
    });
    get().saveHistory();
  },

  clearHistory: () => {
    set({ history: [] });
    get().saveHistory();
  },

  loadHistory: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored) as MCPConnectionHistoryEntry[];
        set({ history });
      }
    } catch (error) {
      console.error('Failed to load connection history from localStorage:', error);
    }
  },

  saveHistory: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { history } = get();
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save connection history to localStorage:', error);
    }
  },
}));

// Initialize store on client side
if (typeof window !== 'undefined') {
  useConnectionStore.getState().loadHistory();
}

