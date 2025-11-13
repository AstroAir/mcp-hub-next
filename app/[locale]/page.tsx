'use client';

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ServerList } from "@/components/mcp/server-list";
import { ServerFormDialog } from "@/components/mcp/server-form-dialog";
import { ServerTemplatesDialog } from "@/components/mcp/server-templates-dialog";
import { RemoteServerLibrary } from "@/components/mcp/remote-server-library";
import { ConfigUploader } from "@/components/mcp/config-uploader";
import { IDEConfigDiscoveryDialog } from "@/components/mcp/ide-config-discovery-dialog";
import { IDEConfigExportDialog } from "@/components/mcp/ide-config-export-dialog";
import {
  ServerSearchFilter,
  type ServerFilterStatus,
  type ServerFilterTransport,
} from "@/components/mcp/server-search-filter";
import { ErrorAlert } from "@/components/mcp/error-alert";
import { useBreadcrumbs } from "@/components/layout/breadcrumb-provider";
import { useServerStore, useConnectionStore, useUIStore } from "@/lib/stores";
import { useHealthMonitor } from "@/lib/hooks/use-health-monitor";
import type { MCPServerConfig, ConnectionStatus } from "@/lib/types";
import { Plus, MessageSquare, Library, Globe, FileJson } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const locale = useLocale();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers, addServer, updateServer, removeServer } = useServerStore();
  const { connections } = useConnectionStore();
  const {
    isServerFormOpen,
    openServerForm,
    closeServerForm,
    errors,
    clearError,
  } = useUIStore();
  const { healthStatuses, startMonitoring, stopMonitoring, manualReconnect } =
    useHealthMonitor();
  const [editingServer, setEditingServer] = useState<MCPServerConfig | undefined>();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isRemoteLibraryOpen, setIsRemoteLibraryOpen] = useState(false);
  const [isConfigUploaderOpen, setIsConfigUploaderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServerFilterStatus>("all");
  const [transportFilter, setTransportFilter] =
    useState<ServerFilterTransport>("all");

  useEffect(() => {
    setBreadcrumbs([{ label: t("breadcrumbs.dashboard") }]);
  }, [setBreadcrumbs, t]);

  const connectedServersCount = Object.values(connections).filter(
    (conn) => conn.status === "connected"
  ).length;

  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          server.name.toLowerCase().includes(query) ||
          server.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all") {
        const connection = connections[server.id];
        const status = connection?.status || "disconnected";
        if (statusFilter === "connected" && status !== "connected") return false;
        if (statusFilter === "disconnected" && status !== "disconnected")
          return false;
        if (statusFilter === "error" && status !== "error") return false;
      }

      if (transportFilter !== "all" && server.transportType !== transportFilter) {
        return false;
      }

      return true;
    });
  }, [servers, searchQuery, statusFilter, transportFilter, connections]);

  const getServerStatus = (serverId: string): ConnectionStatus => {
    return connections[serverId]?.status || "disconnected";
  };

  useEffect(() => {
    servers.forEach((server) => {
      const connection = connections[server.id];
      if (connection?.status === "connected") {
        startMonitoring(server);
      } else {
        stopMonitoring(server.id);
      }
    });

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
      const response = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: server }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("toast.connectSuccess"));
        startMonitoring(server);
      } else {
        toast.error(data.error || t("toast.connectFailed"));
      }
    } catch (error) {
      toast.error(t("toast.connectError"));
      console.error(error);
    }
  };

  const handleDisconnect = async (serverId: string) => {
    try {
      const response = await fetch("/api/mcp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("toast.disconnectSuccess"));
        stopMonitoring(serverId);
      } else {
        toast.error(data.error || t("toast.disconnectFailed"));
      }
    } catch (error) {
      toast.error(t("toast.disconnectError"));
      console.error(error);
    }
  };

  const handleReconnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    try {
      toast.info(t("toast.reconnectPending"));
      await manualReconnect(server);
      toast.success(t("toast.reconnectSuccess"));
    } catch (error) {
      toast.error(t("toast.reconnectError"));
      console.error(error);
    }
  };

  const handleDelete = (serverId: string) => {
    if (confirm(t("confirmations.delete"))) {
      removeServer(serverId);
      toast.success(t("toast.deleteSuccess"));
    }
  };

  const handleEdit = (server: MCPServerConfig) => {
    setEditingServer(server);
    openServerForm();
  };

  const handleTemplateSelect = (config: MCPServerConfig) => {
    addServer(config);
    toast.success(t("toast.templateAdded"));
  };

  const handleSubmit = async (
    config: Omit<MCPServerConfig, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (editingServer) {
        updateServer(editingServer.id, config);
        toast.success(t("toast.updateSuccess"));
      } else {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          addServer(data.data);
          toast.success(t("toast.createSuccess"));
        } else {
          toast.error(data.error || t("toast.createFailed"));
        }
      }

      setEditingServer(undefined);
      closeServerForm();
    } catch (error) {
      toast.error(t("toast.saveError"));
      console.error(error);
    }
  };

  const handleViewDetails = (serverId: string) => {
    router.push(`/servers/${serverId}`, { locale });
  };

  const handleToggleEnabled = (serverId: string, enabled: boolean) => {
    updateServer(serverId, { enabled });
  };

  return (
    <div className="w-full py-4 md:py-8 px-3 md:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {t("hero.title")}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {t("hero.subtitle")}
          </p>
          {connectedServersCount > 0 && (
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t("hero.connected", { count: connectedServersCount } as never)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {connectedServersCount > 0 && (
            <Button variant="outline" onClick={() => router.push("/chat", { locale })}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {t("actions.goToChat")}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsRemoteLibraryOpen(true)}>
            <Globe className="h-4 w-4 mr-2" />
            {t("actions.remoteServers")}
          </Button>
          <Button variant="outline" onClick={() => setIsTemplatesOpen(true)}>
            <Library className="h-4 w-4 mr-2" />
            {t("actions.templates")}
          </Button>
          <IDEConfigDiscoveryDialog onImportComplete={() => toast.success(t("toast.ideImportSuccess"))} />
          <IDEConfigExportDialog />
          <Button variant="outline" onClick={() => setIsConfigUploaderOpen(true)}>
            <FileJson className="h-4 w-4 mr-2" />
            {t("actions.importExport")}
          </Button>
          <Button
            onClick={() => {
              setEditingServer(undefined);
              openServerForm();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("actions.addServer")}
          </Button>
        </div>
      </div>

      <ServerSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        transportFilter={transportFilter}
        onTransportFilterChange={setTransportFilter}
        resultCount={filteredServers.length}
      />

      {errors["dashboard"] && (
        <div className="mb-6">
          <ErrorAlert
            message={errors["dashboard"]}
            onDismiss={() => clearError("dashboard")}
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
