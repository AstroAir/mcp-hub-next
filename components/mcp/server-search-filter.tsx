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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('dashboard.filters');
  const actions = useTranslations('common.actions');
  const status = useTranslations('common.status');

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
            placeholder={t('searchPlaceholder')}
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
            <SelectValue placeholder={t('statusLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('statusAll')}</SelectItem>
            <SelectItem value="connected">{status('connected')}</SelectItem>
            <SelectItem value="disconnected">{status('disconnected')}</SelectItem>
            <SelectItem value="error">{status('error')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Transport Filter */}
        <Select value={transportFilter} onValueChange={(v) => onTransportFilterChange(v as ServerFilterTransport)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('transportLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('transportAll')}</SelectItem>
            <SelectItem value="stdio">{t('transportOptions.stdio')}</SelectItem>
            <SelectItem value="sse">{t('transportOptions.sse')}</SelectItem>
            <SelectItem value="http">{t('transportOptions.http')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            {actions('clear')}
          </Button>
        )}
      </div>

      {/* Active Filters & Result Count */}
      {(hasActiveFilters || resultCount !== undefined) && (
        <div className="flex items-center gap-2 text-sm">
          {resultCount !== undefined && (
            <span className="text-muted-foreground">
              {t('resultCount', { count: resultCount })}
            </span>
          )}
          
          {hasActiveFilters && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    {t('searchBadge')}: {searchQuery}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {t('statusBadge')}: {statusFilter === 'connected'
                      ? status('connected')
                      : statusFilter === 'disconnected'
                        ? status('disconnected')
                        : status('error')}
                  </Badge>
                )}
                {transportFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {t('transportBadge')}: {transportFilter === 'stdio'
                      ? t('transportOptions.stdio')
                      : transportFilter === 'sse'
                        ? t('transportOptions.sse')
                        : t('transportOptions.http')}
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

