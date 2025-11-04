'use client';

/**
 * ServerDetailView Component
 * Displays detailed information about an MCP server
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ServerStatusBadge } from './server-status-badge';
import { ConnectionTypeIcon } from './connection-type-icon';
import { Switch } from '@/components/ui/switch';
import type { MCPServerConfig, MCPConnectionState } from '@/lib/types';

interface ServerDetailViewProps {
  server: MCPServerConfig;
  connectionState?: MCPConnectionState;
}

export function ServerDetailView({ server, connectionState }: ServerDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ConnectionTypeIcon type={server.transportType} className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">{server.name}</h2>
            {server.description && (
              <p className="text-muted-foreground mt-1">{server.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Enabled</span>
            <Switch checked={server.enabled !== false} disabled />
          </div>
          {connectionState && <ServerStatusBadge status={connectionState.status} />}
        </div>
      </div>

      <Separator />

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Server connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium">Transport Type:</span>
            <Badge variant="outline" className="ml-2">
              {server.transportType}
            </Badge>
          </div>

          {server.transportType === 'stdio' && (
            <>
              <div>
                <span className="text-sm font-medium">Command:</span>
                <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
                  {server.command} {server.args?.join(' ')}
                </div>
              </div>
              {server.cwd && (
                <div>
                  <span className="text-sm font-medium">Working Directory:</span>
                  <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
                    {server.cwd}
                  </div>
                </div>
              )}
              {server.env && Object.keys(server.env).length > 0 && (
                <div>
                  <span className="text-sm font-medium">Environment Variables:</span>
                  <div className="font-mono text-sm bg-muted p-2 rounded mt-1 space-y-1">
                    {Object.entries(server.env).map(([key, value]) => (
                      <div key={key}>
                        {key}={value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {(server.transportType === 'sse' || server.transportType === 'http') && (
            <div>
              <span className="text-sm font-medium">URL:</span>
              <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
                {server.url}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tools */}
      {connectionState && connectionState.tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Tools ({connectionState.tools.length})</CardTitle>
            <CardDescription>Tools provided by this server</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {connectionState.tools.map((tool) => (
                  <div key={tool.name} className="border rounded-lg p-3">
                    <div className="font-medium">{tool.name}</div>
                    {tool.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {tool.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {connectionState && connectionState.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Resources ({connectionState.resources.length})</CardTitle>
            <CardDescription>Resources provided by this server</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {connectionState.resources.map((resource) => (
                  <div key={resource.uri} className="border rounded-lg p-3">
                    <div className="font-medium">{resource.name}</div>
                    <div className="font-mono text-xs text-muted-foreground mt-1">
                      {resource.uri}
                    </div>
                    {resource.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {resource.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Prompts */}
      {connectionState && connectionState.prompts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Prompts ({connectionState.prompts.length})</CardTitle>
            <CardDescription>Prompts provided by this server</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {connectionState.prompts.map((prompt) => (
                  <div key={prompt.name} className="border rounded-lg p-3">
                    <div className="font-medium">{prompt.name}</div>
                    {prompt.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {prompt.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

