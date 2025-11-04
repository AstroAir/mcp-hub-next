'use client';

/**
 * Dashboard Page
 * Main page for managing MCP servers
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ServerList } from '@/components/mcp/server-list';
import { ServerFormDialog } from '@/components/mcp/server-form-dialog';
import { ServerTemplatesDialog } from '@/components/mcp/server-templates-dialog';
import { RemoteServerLibrary } from '@/components/mcp/remote-server-library';
import { ConfigUploader } from '@/components/mcp/config-uploader';
import { ServerSearchFilter, type ServerFilterStatus, type ServerFilterTransport } from '@/components/mcp/server-search-filter';
import { ErrorAlert } from '@/components/mcp/error-alert';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { useServerStore, useConnectionStore, useUIStore } from '@/lib/stores';
import { useHealthMonitor } from '@/lib/hooks/use-health-monitor';
import type { MCPServerConfig, ConnectionStatus } from '@/lib/types';
import { Plus, MessageSquare, Library, Power, PowerOff, Globe, FileJson } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers, addServer, updateServer, removeServer } = useServerStore();
  const { connections } = useConnectionStore();
  const { isServerFormOpen, openServerForm, closeServerForm, errors, clearError } = useUIStore();
  const { healthStatuses, startMonitoring, stopMonitoring, manualReconnect } = useHealthMonitor();
  const [editingServer, setEditingServer] = useState<MCPServerConfig | undefined>();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isRemoteLibraryOpen, setIsRemoteLibraryOpen] = useState(false);
  const [isConfigUploaderOpen, setIsConfigUploaderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServerFilterStatus>('all');
  const [transportFilter, setTransportFilter] = useState<ServerFilterTransport>('all');
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard' }]);
  }, [setBreadcrumbs]);

  const connectedServersCount = Object.values(connections).filter(
    (conn) => conn.status === 'connected'
  ).length;

  // Filter servers based on search and filters
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          server.name.toLowerCase().includes(query) ||
          server.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const connection = connections[server.id];
        const status = connection?.status || 'disconnected';
        if (statusFilter === 'connected' && status !== 'connected') return false;
        if (statusFilter === 'disconnected' && status !== 'disconnected') return false;
        if (statusFilter === 'error' && status !== 'error') return false;
      }

      // Transport filter
      if (transportFilter !== 'all' && server.transportType !== transportFilter) {
        return false;
      }

      return true;
    });
  }, [servers, searchQuery, statusFilter, transportFilter, connections]);

  const getServerStatus = (serverId: string): ConnectionStatus => {
    return connections[serverId]?.status || 'disconnected';
  };

  // Start health monitoring for connected servers
  useEffect(() => {
    servers.forEach((server) => {
      const connection = connections[server.id];
      if (connection?.status === 'connected') {
        startMonitoring(server);
      } else {
        stopMonitoring(server.id);
      }
    });

    // Cleanup on unmount
    return () => {
      servers.forEach((server) => {
        stopMonitoring(server.id);
      });
    };
  }, [servers, connections, startMonitoring, stopMonitoring]);

  const handleConnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: server }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Connected to server');
        // Start health monitoring
        startMonitoring(server);
      } else {
        toast.error(data.error || 'Failed to connect');
      }
    } catch (error) {
      toast.error('Failed to connect to server');
      console.error(error);
    }
  };

  const handleDisconnect = async (serverId: string) => {
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Disconnected from server');
        // Stop health monitoring
        stopMonitoring(serverId);
      } else {
        toast.error(data.error || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect from server');
      console.error(error);
    }
  };

  const handleReconnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    try {
      toast.info('Reconnecting...');
      await manualReconnect(server);
      toast.success('Reconnected successfully');
    } catch (error) {
      toast.error('Failed to reconnect');
      console.error(error);
    }
  };

  const handleDelete = (serverId: string) => {
    if (confirm('Are you sure you want to delete this server?')) {
      removeServer(serverId);
      toast.success('Server deleted');
    }
  };

  const handleEdit = (server: MCPServerConfig) => {
    setEditingServer(server);
    openServerForm();
  };

  const handleBulkConnect = async () => {
    const serverIds = Array.from(selectedServers);
    let successCount = 0;

    for (const serverId of serverIds) {
      try {
        const server = servers.find((s) => s.id === serverId);
        if (!server) continue;

        const response = await fetch('/api/mcp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: server }),
        });

        const data = await response.json();
        if (data.success) successCount++;
      } catch (error) {
        console.error(`Failed to connect to server ${serverId}:`, error);
      }
    }

    toast.success(`Connected to ${successCount} of ${serverIds.length} servers`);
    setSelectedServers(new Set());
  };

  const handleBulkDisconnect = async () => {
    const serverIds = Array.from(selectedServers);
    let successCount = 0;

    for (const serverId of serverIds) {
      try {
        const response = await fetch('/api/mcp/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId }),
        });

        const data = await response.json();
        if (data.success) successCount++;
      } catch (error) {
        console.error(`Failed to disconnect from server ${serverId}:`, error);
      }
    }

    toast.success(`Disconnected from ${successCount} of ${serverIds.length} servers`);
    setSelectedServers(new Set());
  };

  const handleTemplateSelect = (config: MCPServerConfig) => {
    addServer(config);
    toast.success('Server added from template');
  };

  const handleSubmit = async (config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingServer) {
        // Update existing server
        updateServer(editingServer.id, config);
        toast.success('Server updated');
      } else {
        // Create new server
        const response = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          addServer(data.data);
          toast.success('Server created');
        } else {
          toast.error(data.error || 'Failed to create server');
        }
      }

      setEditingServer(undefined);
      closeServerForm();
    } catch (error) {
      toast.error('Failed to save server');
      console.error(error);
    }
  };

  const handleViewDetails = (serverId: string) => {
    // Navigate to server details page
    window.location.href = `/servers/${serverId}`;
  };

  const handleToggleEnabled = (serverId: string, enabled: boolean) => {
    updateServer(serverId, { enabled });
  };

  return (
    <div className="w-full py-4 md:py-8 px-3 md:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">MCP Server Hub</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage your Model Context Protocol servers
          </p>
          {connectedServersCount > 0 && (
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {connectedServersCount} server{connectedServersCount !== 1 ? 's' : ''} connected
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedServers.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkConnect}>
                <Power className="h-4 w-4 mr-2" />
                Connect ({selectedServers.size})
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDisconnect}>
                <PowerOff className="h-4 w-4 mr-2" />
                Disconnect ({selectedServers.size})
              </Button>
            </>
          )}
          {connectedServersCount > 0 && (
            <Button variant="outline" onClick={() => router.push('/chat')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Go to Chat
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsRemoteLibraryOpen(true)}>
            <Globe className="h-4 w-4 mr-2" />
            Remote Servers
          </Button>
          <Button variant="outline" onClick={() => setIsTemplatesOpen(true)}>
            <Library className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" onClick={() => setIsConfigUploaderOpen(true)}>
            <FileJson className="h-4 w-4 mr-2" />
            Import/Export
          </Button>
          <Button onClick={() => { setEditingServer(undefined); openServerForm(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <ServerSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        transportFilter={transportFilter}
        onTransportFilterChange={setTransportFilter}
        resultCount={filteredServers.length}
      />

      {errors['dashboard'] && (
        <div className="mb-6">
          <ErrorAlert
            message={errors['dashboard']}
            onDismiss={() => clearError('dashboard')}
          />
        </div>
      )}

      <ServerList
        servers={filteredServers}
        getServerStatus={getServerStatus}
        getServerHealth={(serverId) => healthStatuses.get(serverId)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onViewDetails={handleViewDetails}
        onReconnect={handleReconnect}
        onToggleEnabled={handleToggleEnabled}
      />

      <ServerFormDialog
        open={isServerFormOpen}
        onOpenChange={(open) => {
          if (!open) setEditingServer(undefined);
          closeServerForm();
        }}
        onSubmit={handleSubmit}
        initialData={editingServer}
      />

      <ServerTemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onSelectTemplate={handleTemplateSelect}
      />

      <RemoteServerLibrary
        open={isRemoteLibraryOpen}
        onOpenChange={setIsRemoteLibraryOpen}
      />

      <ConfigUploader
        open={isConfigUploaderOpen}
        onOpenChange={setIsConfigUploaderOpen}
      />
    </div>
  );
}
