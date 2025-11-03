'use client';

/**
 * Remote MCP Server Library
 * Browse and connect to 70+ remote MCP servers
 */

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Globe, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { REMOTE_SERVERS, getOAuthConfigWithRedirect, type RemoteMCPServer } from '@/lib/data/remote-servers';
import { startOAuthFlow, getOAuthToken } from '@/lib/services/oauth-service';
import { useServerStore } from '@/lib/stores';
import type { MCPServerConfig } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface RemoteServerLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoteServerLibrary({ open, onOpenChange }: RemoteServerLibraryProps) {
  const { addServer } = useServerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [connectingServerId, setConnectingServerId] = useState<string | null>(null);

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-success') {
        const { serverId, serverName } = event.data;

        // Find the remote server config
        const remoteServer = REMOTE_SERVERS.find((s) => s.id === serverId);
        if (remoteServer) {
          // Get OAuth token
          const token = getOAuthToken(serverId);

          // Create server config with OAuth token
          const newServerId = nanoid();
          const config: MCPServerConfig = {
            id: newServerId,
            name: remoteServer.name,
            description: remoteServer.description,
            transportType: remoteServer.transportType as 'sse' | 'http',
            url: remoteServer.url,
            headers: {
              ...remoteServer.headers,
              'Authorization': `Bearer ${token?.accessToken}`,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          addServer(config);
          toast.success(`Added ${serverName} with OAuth authentication`);
          onOpenChange(false);
        }

        setConnectingServerId(null);
      } else if (event.data.type === 'oauth-error') {
        toast.error(`Authentication failed: ${event.data.error}`);
        setConnectingServerId(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addServer, onOpenChange]);

  // Filter servers
  const filteredServers = useMemo(() => {
    return REMOTE_SERVERS.filter((server) => {
      // Category filter
      if (selectedCategory !== 'all' && server.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          server.name.toLowerCase().includes(query) ||
          server.description.toLowerCase().includes(query) ||
          server.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(REMOTE_SERVERS.map((s) => s.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const handleConnect = async (server: RemoteMCPServer) => {
    try {
      setConnectingServerId(server.id);

      if (server.requiresOAuth) {
        // OAuth flow
        const oauthConfig = getOAuthConfigWithRedirect(server);
        if (!oauthConfig) {
          throw new Error('OAuth configuration not found');
        }

        // Save OAuth config to session storage for callback
        sessionStorage.setItem(
          `oauth-config-${server.id}`,
          JSON.stringify(oauthConfig)
        );

        // Start OAuth flow
        await startOAuthFlow(server.id, server.name, oauthConfig);

        toast.info('Please complete authentication in the popup window');
      } else {
        // Direct connection (API key based)
        const serverId = nanoid();

        // Create server config
        const config: MCPServerConfig = {
          id: serverId,
          name: server.name,
          description: server.description,
          transportType: server.transportType as 'sse' | 'http',
          url: server.url,
          headers: server.headers,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addServer(config);
        toast.success(`Added ${server.name} to your servers`);
        toast.info('Please configure API keys in server settings');
        setConnectingServerId(null);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to connect to server:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
      setConnectingServerId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Remote MCP Server Library</DialogTitle>
          <DialogDescription>
            Browse and connect to 70+ pre-configured remote MCP servers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {getCategoryLabel(category)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredServers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No servers found matching your criteria
                    </div>
                  ) : (
                    filteredServers.map((server) => {
                      const isConnecting = connectingServerId === server.id;
                      const hasToken = server.requiresOAuth && getOAuthToken(server.id);

                      return (
                        <div
                          key={server.id}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{server.name}</h3>
                                {server.requiresOAuth ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Lock className="h-3 w-3" />
                                    OAuth
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1">
                                    <Globe className="h-3 w-3" />
                                    API Key
                                  </Badge>
                                )}
                                {hasToken && (
                                  <Badge variant="default">Authenticated</Badge>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {server.description}
                              </p>

                              {server.tags && server.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {server.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleConnect(server)}
                                disabled={isConnecting}
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Connecting...
                                  </>
                                ) : hasToken ? (
                                  'Add Server'
                                ) : (
                                  'Connect'
                                )}
                              </Button>

                              {server.documentation && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(server.documentation, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Docs
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredServers.length} of {REMOTE_SERVERS.length} servers
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

