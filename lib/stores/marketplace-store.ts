/**
 * Marketplace Store - Manages Cline marketplace state
 */

import { create } from 'zustand';
import type { MarketplaceStoreState, MarketplaceMCPServer, MarketplaceFilters } from '@/lib/types';
import {
  getMarketplaceServers,
  extractCategories,
  extractTags,
  filterMarketplaceServers,
  sortMarketplaceServers,
} from '@/lib/services/marketplace';

export const useMarketplaceStore = create<MarketplaceStoreState>((set, get) => ({
  // Initial state
  servers: [],
  filteredServers: [],
  selectedServer: null,
  viewMode: 'card',
  filters: {},
  isLoading: false,
  error: null,
  lastFetched: null,
  categories: [],
  allTags: [],

  // Actions
  setServers: (servers: MarketplaceMCPServer[]) => {
    const categories = extractCategories(servers);
    const allTags = extractTags(servers);
    
    set({ 
      servers, 
      categories, 
      allTags,
    });
    
    // Apply filters to update filteredServers
    get().applyFilters();
  },

  setFilteredServers: (filteredServers: MarketplaceMCPServer[]) => {
    set({ filteredServers });
  },

  setSelectedServer: (selectedServer: MarketplaceMCPServer | null) => {
    set({ selectedServer });
  },

  setViewMode: (viewMode) => {
    set({ viewMode });
  },

  setFilters: (newFilters: Partial<MarketplaceFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    
    // Apply filters immediately
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLastFetched: (lastFetched: Date) => {
    set({ lastFetched });
  },

  applyFilters: () => {
    const { servers, filters } = get();
    
    // Filter servers
    let filtered = filterMarketplaceServers(servers, {
      query: filters.query,
      category: filters.category,
      tags: filters.tags,
      requiresApiKey: filters.requiresApiKey,
      isRecommended: filters.isRecommended,
    });

    // Sort servers
    if (filters.sortBy) {
      filtered = sortMarketplaceServers(filtered, filters.sortBy);
    } else {
      // Default sort by stars
      filtered = sortMarketplaceServers(filtered, 'stars');
    }

    // Apply pagination if specified
    if (filters.offset !== undefined || filters.limit !== undefined) {
      const offset = filters.offset || 0;
      const limit = filters.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    set({ filteredServers: filtered });
  },

  fetchServers: async () => {
    const { isLoading, lastFetched } = get();
    
    // Don't fetch if already loading
    if (isLoading) {
      return;
    }

    // Don't fetch if we have recent data (less than 1 hour old)
    if (lastFetched) {
      const age = Date.now() - lastFetched.getTime();
      if (age < 3600000) { // 1 hour
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
      const servers = await getMarketplaceServers(false);
      get().setServers(servers);
      set({ lastFetched: new Date() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch marketplace servers';
      set({ error: errorMessage });
      console.error('Error fetching marketplace servers:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshServers: async () => {
    set({ isLoading: true, error: null });

    try {
      const servers = await getMarketplaceServers(true); // Force refresh
      get().setServers(servers);
      set({ lastFetched: new Date() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh marketplace servers';
      set({ error: errorMessage });
      console.error('Error refreshing marketplace servers:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

