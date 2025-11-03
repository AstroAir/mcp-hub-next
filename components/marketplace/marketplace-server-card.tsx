'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Download, Key, ExternalLink, Info } from 'lucide-react';
import type { MarketplaceMCPServer } from '@/lib/types';

interface MarketplaceServerCardProps {
  server: MarketplaceMCPServer;
  onViewDetails: (server: MarketplaceMCPServer) => void;
}

export function MarketplaceServerCard({ server, onViewDetails }: MarketplaceServerCardProps) {
  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(server.githubUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      className="h-full flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer group border-border/50 hover:border-border"
      onClick={() => onViewDetails(server)}
    >
      <CardHeader className="space-y-3 pb-4">
        {server.isRecommended && (
          <CardAction>
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">Recommended</span>
            </Badge>
          </CardAction>
        )}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-border/50">
            <AvatarImage src={server.logoUrl} alt={server.name} />
            <AvatarFallback className="text-sm font-semibold">
              {server.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1 w-full">
              <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {server.name}
              </CardTitle>
            </div>
            <CardDescription className="text-sm truncate">
              by {server.author}
            </CardDescription>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {server.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-4">
        {/* Category and Tags */}
        <div className="space-y-2">
          {server.category && (
            <Badge variant="secondary" className="font-medium">
              {server.category}
            </Badge>
          )}

          {server.tags && server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {server.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {server.tags.length > 3 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{server.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm pt-1">
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
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleGitHubClick}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          GitHub
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(server);
          }}
        >
          <Info className="h-4 w-4 mr-1.5" />
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}

