'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { useMarketplaceStore } from '@/lib/stores';
import { MarketplaceSearchFilter } from './marketplace-search-filter';
import { MarketplaceServerCard } from './marketplace-server-card';
import { MarketplaceServerListItem } from './marketplace-server-list-item';
import { MarketplaceServerDetail } from './marketplace-server-detail';
import { ErrorState } from '@/components/error/error-state';
import { EmptyState } from '@/components/error/empty-state';
import type { MarketplaceMCPServer } from '@/lib/types';


// Optional responsive grid columns configuration
export type GridColumns = Partial<
  Record<'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', 1 | 2 | 3 | 4 | 5 | 6>
>;

export interface MarketplaceViewProps {
  // Configure the number of items per row across breakpoints
  gridColumns?: GridColumns;
}

// Tailwind safelist for dynamic grid column classes (so JIT includes them)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __TAILWIND_GRID_COL_SAFE__ =
  'grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 ' +
  'sm:grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 sm:grid-cols-5 sm:grid-cols-6 ' +
  'md:grid-cols-1 md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-5 md:grid-cols-6 ' +
  'lg:grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 lg:grid-cols-6 ' +
  'xl:grid-cols-1 xl:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 xl:grid-cols-5 xl:grid-cols-6 ' +
  '2xl:grid-cols-1 2xl:grid-cols-2 2xl:grid-cols-3 2xl:grid-cols-4 2xl:grid-cols-5 2xl:grid-cols-6';

function getGridClass(cfg?: GridColumns) {
  const columns = {
    base: 1 as 1 | 2 | 3 | 4 | 5 | 6,
    md: 2 as 1 | 2 | 3 | 4 | 5 | 6,
    lg: 3 as 1 | 2 | 3 | 4 | 5 | 6,
    xl: 4 as 1 | 2 | 3 | 4 | 5 | 6,
    ...cfg,
  };

  const classes = ['grid'];
  if (columns.base) classes.push(`grid-cols-${columns.base}`);
  if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
  if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
  if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
  if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
  if (columns['2xl']) classes.push(`2xl:grid-cols-${columns['2xl']}`);
  return classes.join(' ');
}

export function MarketplaceView({ gridColumns }: MarketplaceViewProps) {
  const {
    filteredServers,
    selectedServer,
    viewMode,
    isLoading,
    error,
    setViewMode,
    setSelectedServer,
    fetchServers,
    refreshServers,
  } = useMarketplaceStore();

  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch servers on mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleViewDetails = (server: MarketplaceMCPServer) => {
    setSelectedServer(server);
    setDetailOpen(true);
  };

  const handleRefresh = async () => {
    await refreshServers();
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    // Delay clearing selected server to allow dialog animation
    setTimeout(() => setSelectedServer(null), 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Marketplace</h1>
          <p className="text-muted-foreground mt-1.5">
            Discover and explore Model Context Protocol servers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-none border-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <MarketplaceSearchFilter />

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          title="Failed to load marketplace"
          message={error}
          action={{
            label: 'Try Again',
            onClick: handleRefresh,
          }}
        />
      )}

      {/* Loading State */}
      {isLoading && filteredServers.length === 0 && (
        <div className={viewMode === 'card' ? `${getGridClass(gridColumns)} gap-6` : 'space-y-4'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={viewMode === 'card' ? '' : 'p-4 border rounded-lg'}>
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredServers.length === 0 && (
        <EmptyState
          title="No servers found"
          message="Try adjusting your search or filters to find what you're looking for."
          action={{
            label: 'Reset Filters',
            onClick: () => useMarketplaceStore.getState().resetFilters(),
          }}
        />
      )}

      {/* Results Count */}
      {!isLoading && !error && filteredServers.length > 0 && (
        <div className="flex items-center justify-between border-b pb-3">
          <p className="text-sm text-muted-foreground font-medium">
            Showing {filteredServers.length} server{filteredServers.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Card View */}
      {!isLoading && !error && viewMode === 'card' && filteredServers.length > 0 && (
        <div className={`${getGridClass(gridColumns)} gap-6 pb-6`}>
          {filteredServers.map((server) => (
            <MarketplaceServerCard
              key={server.mcpId}
              server={server}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && !error && viewMode === 'list' && filteredServers.length > 0 && (
        <div className="space-y-3 pb-6">
          {filteredServers.map((server) => (
            <MarketplaceServerListItem
              key={server.mcpId}
              server={server}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <MarketplaceServerDetail
        server={selectedServer}
        open={detailOpen}
        onOpenChange={handleDetailClose}
      />
    </div>
  );
}

