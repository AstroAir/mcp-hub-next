'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, X, Star, Key, SlidersHorizontal } from 'lucide-react';
import { useMarketplaceStore } from '@/lib/stores';

export function MarketplaceSearchFilter() {
  const {
    filters,
    categories,
    allTags,
    setFilters,
    resetFilters,
  } = useMarketplaceStore();

  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFilters({ query: value });
  };

  const handleCategoryChange = (value: string) => {
    setFilters({ category: value === 'all' ? undefined : value });
  };

  const handleSortChange = (value: string) => {
    setFilters({ 
      sortBy: value as 'stars' | 'downloads' | 'updated' | 'name' 
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleRecommendedToggle = () => {
    setFilters({ 
      isRecommended: filters.isRecommended === true ? undefined : true 
    });
  };

  const handleApiKeyToggle = () => {
    setFilters({ 
      requiresApiKey: filters.requiresApiKey === false ? undefined : false 
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    resetFilters();
  };

  const hasActiveFilters = 
    filters.query || 
    filters.category || 
    (filters.tags && filters.tags.length > 0) ||
    filters.isRecommended !== undefined ||
    filters.requiresApiKey !== undefined;

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, author, or description..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort Select */}
        <Select
          value={filters.sortBy || 'stars'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Most Stars</SelectItem>
            <SelectItem value="downloads">Most Downloads</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags Dropdown */}
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTags.slice(0, 20).map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Quick Filters */}
        <Button
          variant={filters.isRecommended ? 'default' : 'outline'}
          size="sm"
          onClick={handleRecommendedToggle}
        >
          <Star className="h-4 w-4 mr-2" />
          Recommended
        </Button>

        <Button
          variant={filters.requiresApiKey === false ? 'default' : 'outline'}
          size="sm"
          onClick={handleApiKeyToggle}
        >
          <Key className="h-4 w-4 mr-2" />
          No API Key
        </Button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

