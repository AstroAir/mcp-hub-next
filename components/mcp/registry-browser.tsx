'use client';

/**
 * Registry Browser Component
 * Browse and search MCP servers from the registry
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Github, Star, Download, ExternalLink, Loader2 } from 'lucide-react';
import { registryAPI } from '@/lib/services/api-client';
import { useRegistryStore } from '@/lib/stores/registry-store';
import type { RegistryServerEntry, RegistrySearchFilters } from '@/lib/types';

interface RegistryBrowserProps {
  onSelectServer?: (server: RegistryServerEntry) => void;
}

export function RegistryBrowser({ onSelectServer }: RegistryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<'npm' | 'github' | undefined>(undefined);
  const { searchResults, setSearchResults, setIsSearching: setStoreSearching } = useRegistryStore();

  const loadPopularServers = useCallback(async () => {
    setIsSearching(true);
    setStoreSearching(true);

    try {
      const response = await registryAPI.getPopular(20);

      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error loading popular servers:', error);
    } finally {
      setIsSearching(false);
      setStoreSearching(false);
    }
  }, [setSearchResults, setStoreSearching]);

  useEffect(() => {
    // Load popular servers on mount
    loadPopularServers();
  }, [loadPopularServers]);

  const handleSearch = async () => {
    setIsSearching(true);
    setStoreSearching(true);

    try {
      const filters: RegistrySearchFilters = {
        query: searchQuery || undefined,
        source: selectedSource,
        limit: 50,
      };

      const response = await registryAPI.search({ filters });

      if (response.success && response.data) {
        setSearchResults(response.data.servers);
      }
    } catch (error) {
      console.error('Error searching registry:', error);
    } finally {
      setIsSearching(false);
      setStoreSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search MCP servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Source Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedSource === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSource(undefined)}
        >
          All
        </Button>
        <Button
          variant={selectedSource === 'npm' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSource('npm')}
        >
          <Package className="h-4 w-4 mr-1" />
          NPM
        </Button>
        <Button
          variant={selectedSource === 'github' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSource('github')}
        >
          <Github className="h-4 w-4 mr-1" />
          GitHub
        </Button>
      </div>

      {/* Results */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12 text-muted-foreground">
              No servers found. Try a different search query.
            </div>
          )}

          {searchResults.map((server) => (
            <RegistryServerCard
              key={server.id}
              server={server}
              onSelect={() => onSelectServer?.(server)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface RegistryServerCardProps {
  server: RegistryServerEntry;
  onSelect?: () => void;
}

function RegistryServerCard({ server, onSelect }: RegistryServerCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{server.name}</CardTitle>
              {server.verified && (
                <Badge variant="default" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {server.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {server.source === 'npm' ? (
              <Package className="h-4 w-4" />
            ) : (
              <Github className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {server.version && <span>v{server.version}</span>}
            {server.downloads !== undefined && (
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{formatNumber(server.downloads)}</span>
              </div>
            )}
            {server.stars !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{formatNumber(server.stars)}</span>
              </div>
            )}
          </div>

          {server.homepage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(server.homepage, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        {server.tags && server.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {server.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

