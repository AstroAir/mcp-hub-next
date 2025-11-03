/**
 * Server Store - Manages MCP server configurations
 */

import { create } from 'zustand';
import type {
  ServerStoreState,
  MCPServerConfig,
  InstallationProgress,
  InstalledServerMetadata
} from '@/lib/types';

const STORAGE_KEY = 'mcp-servers';
const INSTALLATIONS_KEY = 'mcp-installations';
const INSTALLED_SERVERS_KEY = 'mcp-installed-servers';

export const useServerStore = create<ServerStoreState>((set, get) => ({
  servers: [],
  installations: {},
  installedServers: {},

  addServer: (server: MCPServerConfig) => {
    set((state) => ({
      servers: [...state.servers, server],
    }));
    get().saveServers();
  },

  updateServer: (id: string, updates: Partial<MCPServerConfig>) => {
    set((state) => ({
      servers: state.servers.map((server) =>
        server.id === id
          ? { ...server, ...updates, updatedAt: new Date().toISOString() } as MCPServerConfig
          : server
      ),
    }));
    get().saveServers();
  },

  removeServer: (id: string) => {
    set((state) => ({
      servers: state.servers.filter((server) => server.id !== id),
    }));
    get().saveServers();
  },

  getServer: (id: string) => {
    return get().servers.find((server) => server.id === id);
  },

  // Installation actions
  setInstallationProgress: (installId: string, progress: InstallationProgress) => {
    set((state) => ({
      installations: {
        ...state.installations,
        [installId]: progress,
      },
    }));
    get().saveInstallations();
  },

  removeInstallation: (installId: string) => {
    set((state) => {
       
      const { [installId]: _removed, ...rest } = state.installations;
      return { installations: rest };
    });
    get().saveInstallations();
  },

  getInstallation: (installId: string) => {
    return get().installations[installId];
  },

  addInstalledServer: (metadata: InstalledServerMetadata) => {
    set((state) => ({
      installedServers: {
        ...state.installedServers,
        [metadata.serverId]: metadata,
      },
    }));
    get().saveInstallations();
  },

  removeInstalledServer: (serverId: string) => {
    set((state) => {
       
      const { [serverId]: _removed, ...rest } = state.installedServers;
      return { installedServers: rest };
    });
    get().saveInstallations();
  },

  getInstalledServer: (serverId: string) => {
    return get().installedServers[serverId];
  },

  loadServers: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const servers = JSON.parse(stored) as MCPServerConfig[];
        set({ servers });
      }
    } catch (error) {
      console.error('Failed to load servers from localStorage:', error);
    }
  },

  saveServers: () => {
    if (typeof window === 'undefined') return;

    try {
      const { servers } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error('Failed to save servers to localStorage:', error);
    }
  },

  loadInstallations: () => {
    if (typeof window === 'undefined') return;

    try {
      const installationsStored = localStorage.getItem(INSTALLATIONS_KEY);
      const installedServersStored = localStorage.getItem(INSTALLED_SERVERS_KEY);

      if (installationsStored) {
        const installations = JSON.parse(installationsStored);
        set({ installations });
      }

      if (installedServersStored) {
        const installedServers = JSON.parse(installedServersStored);
        set({ installedServers });
      }
    } catch (error) {
      console.error('Failed to load installations from localStorage:', error);
    }
  },

  saveInstallations: () => {
    if (typeof window === 'undefined') return;

    try {
      const { installations, installedServers } = get();
      localStorage.setItem(INSTALLATIONS_KEY, JSON.stringify(installations));
      localStorage.setItem(INSTALLED_SERVERS_KEY, JSON.stringify(installedServers));
    } catch (error) {
      console.error('Failed to save installations to localStorage:', error);
    }
  },
}));

// Initialize store on client side
if (typeof window !== 'undefined') {
  useServerStore.getState().loadServers();
  useServerStore.getState().loadInstallations();
}

