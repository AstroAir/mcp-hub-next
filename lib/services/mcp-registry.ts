/**
 * MCP Server Registry Service
 * Handles discovery and cataloging of available MCP servers
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type {
  RegistryServerEntry,
  RegistrySearchFilters,
} from '@/lib/types';

const execAsync = promisify(exec);

/**
 * Registry cache
 */
let registryCache: RegistryServerEntry[] = [];
let lastCacheUpdate: Date | null = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Known MCP server packages (curated list)
 */
const KNOWN_MCP_PACKAGES = [
  '@modelcontextprotocol/server-filesystem',
  '@modelcontextprotocol/server-github',
  '@modelcontextprotocol/server-postgres',
  '@modelcontextprotocol/server-sqlite',
  '@modelcontextprotocol/server-slack',
  '@modelcontextprotocol/server-brave-search',
  '@modelcontextprotocol/server-puppeteer',
  '@modelcontextprotocol/server-memory',
  '@modelcontextprotocol/server-fetch',
  '@modelcontextprotocol/server-google-maps',
];

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  if (!lastCacheUpdate) {
    return false;
  }

  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastCacheUpdate.getTime();
  return timeSinceUpdate < CACHE_TTL;
}

/**
 * Search npm registry for MCP servers
 */
async function searchNPMRegistry(query?: string): Promise<RegistryServerEntry[]> {
  try {
    const searchQuery = query || 'mcp-server';
    const { stdout } = await execAsync(
      `npm search ${searchQuery} --json --long`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    const results = JSON.parse(stdout);
    
    return results
      .filter((pkg: { name: string; keywords?: string[] }) => {
        // Filter for MCP-related packages
        const isMCPPackage = 
          pkg.name.includes('mcp') ||
          pkg.keywords?.some((kw: string) => 
            kw.includes('mcp') || kw.includes('model-context-protocol')
          );
        
        return isMCPPackage;
      })
      .map((pkg: {
        name: string;
        description: string;
        version: string;
        author?: { name?: string };
        links?: { homepage?: string; repository?: string };
        date?: string;
        keywords?: string[];
      }) => {
        const entry: RegistryServerEntry = {
          id: pkg.name,
          name: pkg.name,
          description: pkg.description || '',
          source: 'npm',
          packageName: pkg.name,
          version: pkg.version,
          author: pkg.author?.name,
          homepage: pkg.links?.homepage,
          documentation: pkg.links?.repository,
          tags: pkg.keywords || [],
          lastUpdated: pkg.date,
          verified: KNOWN_MCP_PACKAGES.includes(pkg.name),
        };

        return entry;
      });
  } catch (error) {
    console.error('Error searching npm registry:', error);
    return [];
  }
}

/**
 * Search GitHub for MCP servers
 */
async function searchGitHubRepos(query?: string): Promise<RegistryServerEntry[]> {
  try {
    // Note: This is a simplified implementation
    // In production, you would use the GitHub API with authentication
    const searchQuery = query || 'mcp-server';
    
    // For now, return empty array
    // TODO: Implement GitHub API search with proper authentication
    console.log('GitHub search not yet implemented:', searchQuery);
    return [];
  } catch (error) {
    console.error('Error searching GitHub:', error);
    return [];
  }
}

/**
 * Get curated list of known MCP servers
 */
function getKnownServers(): RegistryServerEntry[] {
  return KNOWN_MCP_PACKAGES.map((packageName) => {
    const name = packageName.replace('@modelcontextprotocol/server-', '');
    
    return {
      id: packageName,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `Official MCP ${name} server`,
      source: 'npm',
      packageName,
      homepage: `https://github.com/modelcontextprotocol/servers`,
      documentation: `https://github.com/modelcontextprotocol/servers/tree/main/src/${name}`,
      tags: ['official', 'mcp', name],
      verified: true,
    };
  });
}

/**
 * Update registry cache
 */
async function updateCache(): Promise<void> {
  try {
    // Get known servers first
    const knownServers = getKnownServers();
    
    // Search npm registry
    const npmServers = await searchNPMRegistry();
    
    // Search GitHub (when implemented)
    const githubServers = await searchGitHubRepos();
    
    // Combine and deduplicate
    const allServers = [...knownServers, ...npmServers, ...githubServers];
    const uniqueServers = Array.from(
      new Map(allServers.map((server) => [server.id, server])).values()
    );
    
    registryCache = uniqueServers;
    lastCacheUpdate = new Date();
  } catch (error) {
    console.error('Error updating registry cache:', error);
  }
}

/**
 * Search registry with filters
 */
export async function searchRegistry(
  filters: RegistrySearchFilters
): Promise<{ servers: RegistryServerEntry[]; total: number; hasMore: boolean }> {
  // Update cache if needed
  if (!isCacheValid()) {
    await updateCache();
  }

  let results = [...registryCache];

  // Apply filters
  if (filters.query) {
    const query = filters.query.toLowerCase();
    results = results.filter((server) => {
      return (
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        server.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }

  if (filters.source) {
    results = results.filter((server) => server.source === filters.source);
  }

  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((server) => {
      return filters.tags!.some((tag) => 
        server.tags?.includes(tag)
      );
    });
  }

  if (filters.verified !== undefined) {
    results = results.filter((server) => server.verified === filters.verified);
  }

  // Sort results
  const sortBy = filters.sortBy || 'relevance';
  results.sort((a, b) => {
    switch (sortBy) {
      case 'downloads':
        return (b.downloads || 0) - (a.downloads || 0);
      case 'stars':
        return (b.stars || 0) - (a.stars || 0);
      case 'updated':
        if (!a.lastUpdated) return 1;
        if (!b.lastUpdated) return -1;
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'relevance':
      default:
        // Verified servers first, then alphabetical
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return a.name.localeCompare(b.name);
    }
  });

  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  const total = results.length;
  const paginatedResults = results.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    servers: paginatedResults,
    total,
    hasMore,
  };
}

/**
 * Get server by ID
 */
export async function getServerById(serverId: string): Promise<RegistryServerEntry | null> {
  // Update cache if needed
  if (!isCacheValid()) {
    await updateCache();
  }

  return registryCache.find((server) => server.id === serverId) || null;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<string[]> {
  // Update cache if needed
  if (!isCacheValid()) {
    await updateCache();
  }

  const categories = new Set<string>();
  
  registryCache.forEach((server) => {
    server.tags?.forEach((tag) => categories.add(tag));
  });

  return Array.from(categories).sort();
}

/**
 * Get popular servers
 */
export async function getPopularServers(
  limit: number = 10,
  source?: 'npm' | 'github'
): Promise<RegistryServerEntry[]> {
  const filters: RegistrySearchFilters = {
    source,
    limit,
    sortBy: 'downloads',
  };

  const { servers } = await searchRegistry(filters);
  return servers;
}

/**
 * Force cache refresh
 */
export async function refreshCache(): Promise<void> {
  await updateCache();
}

/**
 * Clear cache
 */
export function clearCache(): void {
  registryCache = [];
  lastCacheUpdate = null;
}

