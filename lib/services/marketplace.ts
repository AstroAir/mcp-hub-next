/**
 * Cline Marketplace Service
 * Handles fetching and caching MCP servers from Cline's marketplace API
 */

import type { MarketplaceMCPServer } from '@/lib/types';

const CACHE_KEY = 'mcp-marketplace-cache';
const CACHE_TIMESTAMP_KEY = 'mcp-marketplace-cache-timestamp';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetch MCP servers from our API route (which proxies to Cline's marketplace API)
 */
export async function fetchMarketplaceServers(forceRefresh = false): Promise<MarketplaceMCPServer[]> {
  try {
    const url = forceRefresh ? '/api/marketplace?refresh=true' : '/api/marketplace';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch marketplace data: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch marketplace data');
    }

    return result.data as MarketplaceMCPServer[];
  } catch (error) {
    console.error('Error fetching marketplace servers:', error);
    throw error;
  }
}

/**
 * Get cached marketplace data if available and not expired
 */
export function getCachedMarketplaceServers(): MarketplaceMCPServer[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_TTL) {
      // Cache expired
      clearMarketplaceCache();
      return null;
    }

    return JSON.parse(cached) as MarketplaceMCPServer[];
  } catch (error) {
    console.error('Error reading marketplace cache:', error);
    clearMarketplaceCache();
    return null;
  }
}

/**
 * Save marketplace data to cache
 */
export function cacheMarketplaceServers(servers: MarketplaceMCPServer[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(servers));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching marketplace data:', error);
  }
}

/**
 * Clear marketplace cache
 */
export function clearMarketplaceCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing marketplace cache:', error);
  }
}

/**
 * Get marketplace servers with caching
 * Returns cached data if available, otherwise fetches from API
 */
export async function getMarketplaceServers(forceRefresh = false): Promise<MarketplaceMCPServer[]> {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedMarketplaceServers();
    if (cached) {
      return cached;
    }
  }

  // Fetch from API
  const servers = await fetchMarketplaceServers(forceRefresh);

  // Cache the results
  cacheMarketplaceServers(servers);

  return servers;
}

/**
 * Extract unique categories from marketplace servers
 */
export function extractCategories(servers: MarketplaceMCPServer[]): string[] {
  const categories = new Set<string>();
  
  servers.forEach((server) => {
    if (server.category) {
      categories.add(server.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Extract unique tags from marketplace servers
 */
export function extractTags(servers: MarketplaceMCPServer[]): string[] {
  const tags = new Set<string>();
  
  servers.forEach((server) => {
    server.tags?.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Filter marketplace servers based on criteria
 */
export function filterMarketplaceServers(
  servers: MarketplaceMCPServer[],
  filters: {
    query?: string;
    category?: string;
    tags?: string[];
    requiresApiKey?: boolean;
    isRecommended?: boolean;
  }
): MarketplaceMCPServer[] {
  let filtered = [...servers];

  // Apply query filter (search in name, author, description)
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter((server) => {
      return (
        server.name.toLowerCase().includes(query) ||
        server.author.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query)
      );
    });
  }

  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter((server) => server.category === filters.category);
  }

  // Apply tags filter (server must have at least one of the specified tags)
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((server) => {
      return filters.tags!.some((tag) => server.tags.includes(tag));
    });
  }

  // Apply requiresApiKey filter
  if (filters.requiresApiKey !== undefined) {
    filtered = filtered.filter((server) => server.requiresApiKey === filters.requiresApiKey);
  }

  // Apply isRecommended filter
  if (filters.isRecommended !== undefined) {
    filtered = filtered.filter((server) => server.isRecommended === filters.isRecommended);
  }

  return filtered;
}

/**
 * Sort marketplace servers
 */
export function sortMarketplaceServers(
  servers: MarketplaceMCPServer[],
  sortBy: 'stars' | 'downloads' | 'updated' | 'name' = 'stars'
): MarketplaceMCPServer[] {
  const sorted = [...servers];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'stars':
        return b.githubStars - a.githubStars;
      case 'downloads':
        return b.downloadCount - a.downloadCount;
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return sorted;
}

