'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { ScrollArea } from '@/ui/scroll-area';
import { Loader2, Search, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { discoverIDEConfigs, importIDEConfig } from '@/lib/services/ide-config-service';
import { useServerStore } from '@/lib/stores';
import type { ConfigDiscovery } from '@/lib/types/tauri';
import type { MCPClientType } from '@/lib/types/mcp';
import { toast } from 'sonner';
import { mergeServers } from '@/lib/utils/config-parser';

interface IDEConfigDiscoveryDialogProps {
  onImportComplete?: () => void;
}

export function IDEConfigDiscoveryDialog({ onImportComplete }: IDEConfigDiscoveryDialogProps) {
  const t = useTranslations('servers');
  const [open, setOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveries, setDiscoveries] = useState<ConfigDiscovery[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const { servers, addServer } = useServerStore();

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const results = await discoverIDEConfigs();
      setDiscoveries(results);

      // Show feedback about discovery results
      const foundConfigs = results.filter(r => r.found && r.readable);
      if (foundConfigs.length === 0) {
        toast.info(t('toast.noConfigsFound', 'No IDE configs found on this system'));
      }
    } catch (error) {
      console.error('Discovery failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        t('toast.discoveryError',
          { error: errorMessage },
          `Failed to discover IDE configs: ${errorMessage}`
        )
      );
    } finally {
      setDiscovering(false);
    }
  };

  const handleImport = async (discovery: ConfigDiscovery) => {
    setImporting(discovery.configPath);
    try {
      const importedServers = await importIDEConfig(
        discovery.configPath,
        discovery.clientType as MCPClientType,
        'merge'
      );

      // Check if any servers were imported
      if (importedServers.length === 0) {
        toast.warning(t('toast.noServersFound', 'No servers found in config file'));
        setImporting(null);
        return;
      }

      // Merge with existing servers (handles duplicates by renaming)
      const beforeCount = servers.length;
      const mergedServers = mergeServers(servers, importedServers);
      const afterCount = mergedServers.length;
      const newServersCount = afterCount - beforeCount;
      const renamedCount = importedServers.length - newServersCount;

      // Add only the new servers to the store
      const newServers = mergedServers.slice(beforeCount);
      newServers.forEach((server) => addServer(server));

      // Show success message
      const clientTypeLabel = getClientTypeLabel(discovery.clientType);
      toast.success(
        t('toast.importSuccess',
          { count: newServersCount, clientType: clientTypeLabel },
          `Successfully imported ${newServersCount} server(s) from ${clientTypeLabel}`
        )
      );

      // Show info about renamed duplicates if any
      if (renamedCount > 0) {
        toast.info(
          t('toast.duplicatesRenamed',
            { count: renamedCount },
            `${renamedCount} duplicate server(s) were renamed`
          )
        );
      }

      onImportComplete?.();
      setOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        t('toast.importError',
          { error: errorMessage },
          `Failed to import config: ${errorMessage}`
        )
      );
    } finally {
      setImporting(null);
    }
  };

  const getClientTypeLabel = (clientType: string): string => {
    const labels: Record<string, string> = {
      'claude-desktop': 'Claude Desktop',
      'vscode': 'VS Code',
      'cursor': 'Cursor',
      'windsurf': 'Windsurf',
      'zed': 'Zed',
      'cline': 'Cline',
      'continue': 'Continue',
    };
    return labels[clientType] || clientType;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleDiscover}>
          <Search className="mr-2 h-4 w-4" />
          {t('discoverIDEConfigs', 'Discover IDE Configs')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ideConfigDiscovery', 'IDE Config Discovery')}</DialogTitle>
          <DialogDescription>
            {t('ideConfigDiscoveryDesc', 'Automatically discover and import MCP server configurations from installed IDEs')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {discovering && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t('scanning', 'Scanning for IDE configs...')}
              </span>
            </div>
          )}

          {!discovering && discoveries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('noIDEConfigsFound', 'No IDE configs found. Click "Discover IDE Configs" to scan.')}</p>
            </div>
          )}

          {!discovering && discoveries.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {discoveries.map((discovery) => (
                  <div
                    key={discovery.configPath}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {getClientTypeLabel(discovery.clientType)}
                        </Badge>
                        {discovery.found && discovery.readable ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm font-mono text-muted-foreground truncate">
                        {discovery.configPath}
                      </p>
                      {discovery.serverCount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('serversFound', { count: discovery.serverCount }, `${discovery.serverCount} server(s) found`)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={!discovery.found || !discovery.readable || importing === discovery.configPath}
                      onClick={() => handleImport(discovery)}
                    >
                      {importing === discovery.configPath ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {t('import', 'Import')}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

