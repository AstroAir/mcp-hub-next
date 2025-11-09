'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerList } from "@/components/mcp/server-list";
import { useBreadcrumbs } from "@/components/layout/breadcrumb-provider";
import { useServerStore } from "@/lib/stores";
import type {
  ConnectionStatus,
  MCPConnectionState,
  MCPServerConfig,
  MCPServerProcess,
} from "@/lib/types";
import type { UnifiedMCPStatus } from "@/lib/types/api";
import {
  RefreshCw,
  Power,
  PowerOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

type UnifiedConnections = Record<string, MCPConnectionState | undefined>;

export default function ServersManagementPage() {
  const t = useTranslations("servers");
  const locale = useLocale();
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { servers, updateServer, removeServer } = useServerStore();

  const [status, setStatus] = useState<UnifiedMCPStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: t("breadcrumbs.root") }]);
  }, [setBreadcrumbs, t]);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mcp", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setStatus(json.data as UnifiedMCPStatus);
      } else {
        toast.error(json.error || t("toasts.loadFailed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("toasts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const connections: UnifiedConnections = useMemo(() => {
    const map: UnifiedConnections = {};
    if (!status) return map;
    for (const [id, conn] of Object.entries(status.connections || {})) {
      map[id] = conn as MCPConnectionState;
    }
    return map;
  }, [status]);

  const processes: Record<string, MCPServerProcess> = useMemo(() => {
    return (status?.processes as Record<string, MCPServerProcess>) || {};
  }, [status]);

  const getServerStatus = (serverId: string): ConnectionStatus => {
    const s = connections[serverId];
    return s?.status || "disconnected";
  };

  const handleConnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", config: server }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("toasts.connect"));
        fetchStatus();
      } else {
        toast.error(json.error || t("toasts.connectFailed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("toasts.connectFailed"));
    }
  };

  const handleDisconnect = async (serverId: string) => {
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", serverId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("toasts.disconnect"));
        fetchStatus();
      } else {
        toast.error(json.error || t("toasts.disconnectFailed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("toasts.disconnectFailed"));
    }
  };

  const handleToggleEnabled = (serverId: string, enabled: boolean) => {
    updateServer(serverId, { enabled });
  };

  const handleBulkConnect = async () => {
    const targets = servers.filter((s) => s.enabled !== false);
    let ok = 0;
    for (const srv of targets) {
      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "connect", config: srv }),
        });
        const json = await res.json();
        if (json.success) ok++;
      } catch (error) {
        console.error(error);
      }
    }
    toast.success(t("toasts.bulkConnect", { success: ok, total: targets.length }));
    fetchStatus();
  };

  const handleBulkDisconnect = async () => {
    const ids = Object.keys(connections);
    let ok = 0;
    for (const id of ids) {
      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "disconnect", serverId: id }),
        });
        const json = await res.json();
        if (json.success) ok++;
      } catch (error) {
        console.error(error);
      }
    }
    toast.success(t("toasts.bulkDisconnect", { success: ok, total: ids.length }));
    fetchStatus();
  };

  const handleEnableAll = () => {
    servers.forEach((s) => updateServer(s.id, { enabled: true }));
    toast.success(t("toasts.enableAll"));
  };

  const handleDisableAll = () => {
    servers.forEach((s) => updateServer(s.id, { enabled: false }));
    toast.success(t("toasts.disableAll"));
  };

  const runningCount = useMemo(
    () => Object.values(processes).filter((p) => p.state === "running").length,
    [processes]
  );
  const connectedCount = useMemo(
    () => Object.values(connections).filter((c) => c?.status === "connected").length,
    [connections]
  );

  return (
    <div className="w-full py-4 md:py-8 px-3 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("hero.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("hero.subtitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("hero.stats", { connected: connectedCount, running: runningCount })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("actions.refresh")}
          </Button>
          <Button variant="outline" onClick={handleEnableAll}>
            <ToggleRight className="h-4 w-4 mr-2" />
            {t("actions.enableAll")}
          </Button>
          <Button variant="outline" onClick={handleDisableAll}>
            <ToggleLeft className="h-4 w-4 mr-2" />
            {t("actions.disableAll")}
          </Button>
          <Button variant="outline" onClick={handleBulkConnect}>
            <Power className="h-4 w-4 mr-2" />
            {t("actions.bulkConnect")}
          </Button>
          <Button variant="outline" onClick={handleBulkDisconnect}>
            <PowerOff className="h-4 w-4 mr-2" />
            {t("actions.bulkDisconnect")}
          </Button>
        </div>
      </div>

      <ServerList
        servers={servers}
        getServerStatus={getServerStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onDelete={(id) => removeServer(id)}
        onEdit={(server: MCPServerConfig) =>
          router.push(`/servers/${server.id}`, { locale })
        }
        onViewDetails={(id) => router.push(`/servers/${id}`, { locale })}
        onToggleEnabled={handleToggleEnabled}
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("processes.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(processes).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("processes.empty")}</p>
            ) : (
              <div className="space-y-3">
                {Object.values(processes).map((p) => (
                  <div
                    key={p.serverId}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {servers.find((s) => s.id === p.serverId)?.name || p.serverId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("processes.meta", {
                          pid: p.pid != null ? String(p.pid) : "—",
                          state: p.state,
                          restarts: p.restartCount,
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.uptime ? t("processes.uptime", { seconds: p.uptime }) : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
