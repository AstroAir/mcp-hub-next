/**
 * Lifecycle Store - Manages MCP server process states
 */

import { create } from 'zustand';
import type { LifecycleStoreState, MCPServerProcess } from '@/lib/types';

const STORAGE_KEY = 'mcp-processes';

export const useLifecycleStore = create<LifecycleStoreState>((set, get) => ({
  processes: {},

  setProcess: (serverId: string, process: MCPServerProcess) => {
    set((state) => ({
      processes: {
        ...state.processes,
        [serverId]: process,
      },
    }));
    get().saveProcesses();
  },

  updateProcessState: (serverId: string, updates: Partial<MCPServerProcess>) => {
    set((state) => ({
      processes: {
        ...state.processes,
        [serverId]: {
          ...state.processes[serverId],
          ...updates,
        },
      },
    }));
    get().saveProcesses();
  },

  removeProcess: (serverId: string) => {
    set((state) => {
       
      const { [serverId]: _removed, ...rest } = state.processes;
      return { processes: rest };
    });
    get().saveProcesses();
  },

  getProcess: (serverId: string) => {
    return get().processes[serverId];
  },

  getRunningProcesses: () => {
    const { processes } = get();
    return Object.values(processes).filter(
      (process) => process.state === 'running'
    );
  },

  loadProcesses: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const processes = JSON.parse(stored);
        set({ processes });
      }
    } catch (error) {
      console.error('Failed to load processes from localStorage:', error);
    }
  },

  saveProcesses: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { processes } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
    } catch (error) {
      console.error('Failed to save processes to localStorage:', error);
    }
  },
}));

// Initialize store on client side
if (typeof window !== 'undefined') {
  useLifecycleStore.getState().loadProcesses();
}

