/**
 * Registry Store - Manages MCP server registry and discovery
 */

import { create } from 'zustand';
import type { RegistryStoreState, RegistryServerEntry } from '@/lib/types';

export const useRegistryStore = create<RegistryStoreState>((set) => ({
  servers: [],
  searchResults: [],
  isSearching: false,
  selectedServer: null,
  categories: [],

  setServers: (servers: RegistryServerEntry[]) => {
    set({ servers });
  },

  setSearchResults: (searchResults: RegistryServerEntry[]) => {
    set({ searchResults });
  },

  setIsSearching: (isSearching: boolean) => {
    set({ isSearching });
  },

  setSelectedServer: (server: RegistryServerEntry | null) => {
    set({ selectedServer: server });
  },

  setCategories: (categories: string[]) => {
    set({ categories });
  },

  clearSearch: () => {
    set({ searchResults: [], isSearching: false });
  },
}));

