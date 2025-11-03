'use client';

/**
 * ServerSearchFilter Component
 * Search and filter controls for server list
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';

export type ServerFilterStatus = 'all' | 'connected' | 'disconnected' | 'error';
export type ServerFilterTransport = 'all' | 'stdio' | 'sse' | 'http';

interface ServerSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ServerFilterStatus;
  onStatusFilterChange: (status: ServerFilterStatus) => void;
  transportFilter: ServerFilterTransport;
  onTransportFilterChange: (transport: ServerFilterTransport) => void;
  resultCount?: number;
}

export function ServerSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  transportFilter,
  onTransportFilterChange,
  resultCount,
}: ServerSearchFilterProps) {
  const hasActiveFilters = statusFilter !== 'all' || transportFilter !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onTransportFilterChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search servers..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as ServerFilterStatus)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Transport Filter */}
        <Select value={transportFilter} onValueChange={(v) => onTransportFilterChange(v as ServerFilterTransport)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Transport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stdio">Stdio</SelectItem>
            <SelectItem value="sse">SSE</SelectItem>
            <SelectItem value="http">HTTP</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters & Result Count */}
      {(hasActiveFilters || resultCount !== undefined) && (
        <div className="flex items-center gap-2 text-sm">
          {resultCount !== undefined && (
            <span className="text-muted-foreground">
              {resultCount} server{resultCount !== 1 ? 's' : ''} found
            </span>
          )}
          
          {hasActiveFilters && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchQuery}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter}
                  </Badge>
                )}
                {transportFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Transport: {transportFilter}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

