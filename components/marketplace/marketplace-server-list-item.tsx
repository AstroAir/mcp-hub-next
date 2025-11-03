'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Download, Key, ExternalLink, Info } from 'lucide-react';
import type { MarketplaceMCPServer } from '@/lib/types';

interface MarketplaceServerListItemProps {
  server: MarketplaceMCPServer;
  onViewDetails: (server: MarketplaceMCPServer) => void;
}

export function MarketplaceServerListItem({ server, onViewDetails }: MarketplaceServerListItemProps) {
  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(server.githubUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm hover:border-border transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails(server)}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-border/50">
        <AvatarImage src={server.logoUrl} alt={server.name} />
        <AvatarFallback className="text-sm font-semibold">
          {server.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
            {server.name}
          </h3>
          {server.isRecommended && (
            <Badge variant="default" className="flex-shrink-0 gap-1">
              <Star className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">Recommended</span>
            </Badge>
          )}
          {server.category && (
            <Badge variant="secondary" className="flex-shrink-0 font-medium">
              {server.category}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-1">
          <span className="font-medium">by {server.author}</span>
          <span className="mx-2">•</span>
          {server.description}
        </p>

        {/* Tags */}
        {server.tags && server.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {server.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {server.tags.length > 4 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{server.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-6 text-sm flex-shrink-0">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-4 w-4" />
          <span className="font-medium">{server.githubStars.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Download className="h-4 w-4" />
          <span className="font-medium">{server.downloadCount.toLocaleString()}</span>
        </div>
        {server.requiresApiKey && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <Key className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGitHubClick}
        >
          <ExternalLink className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">GitHub</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(server);
          }}
        >
          <Info className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Details</span>
        </Button>
      </div>
    </div>
  );
}

