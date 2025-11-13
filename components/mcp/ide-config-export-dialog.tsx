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
  DialogFooter,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Checkbox } from '@/ui/checkbox';
import { ScrollArea } from '@/ui/scroll-area';
import { Loader2, Download, FileJson } from 'lucide-react';
import { exportToIDEFormat } from '@/lib/services/ide-config-service';
import { isTauri, invoke } from '@/lib/services/tauri-bridge';
import { useServerStore } from '@/lib/stores';
import { toast } from 'sonner';
import type { MCPClientType, MCPServerConfig } from '@/lib/types/mcp';

interface IDEConfigExportDialogProps {
  preselectedServers?: MCPServerConfig[];
}

export function IDEConfigExportDialog({ preselectedServers }: IDEConfigExportDialogProps) {
  const t = useTranslations('servers');
  const { servers } = useServerStore();
  const [open, setOpen] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<Set<string>>(
    new Set(preselectedServers?.map(s => s.id) || [])
  );
  const [clientType, setClientType] = useState<MCPClientType>('claude-desktop');
  const [exporting, setExporting] = useState(false);

  const handleToggleServer = (serverId: string) => {
    const newSet = new Set(selectedServerIds);
    if (newSet.has(serverId)) {
      newSet.delete(serverId);
    } else {
      newSet.add(serverId);
    }
    setSelectedServerIds(newSet);
  };

  const handleSelectAll = () => {
    setSelectedServerIds(new Set(servers.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedServerIds(new Set());
  };

  const handleExport = async () => {
    if (selectedServerIds.size === 0) {
      toast.error(t('exportNoServersSelected', 'Please select at least one server to export'));
      return;
    }

    setExporting(true);
    try {
      const selectedServers = servers.filter(s => selectedServerIds.has(s.id));
      
      if (isTauri()) {
        // Desktop mode: use file save dialog
        const path = await invoke<string | null>('save_file_dialog', {
          title: 'Export IDE Config',
          defaultPath: `mcp-config-${clientType}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        if (!path) {
          setExporting(false);
          return;
        }

        await exportToIDEFormat(selectedServers, clientType, path);
        toast.success(t('exportSuccess', `Exported ${selectedServers.length} server(s) to ${path}`));
      } else {
        // Web mode: download as file
        const json = await exportToIDEFormat(selectedServers, clientType);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcp-config-${clientType}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t('exportSuccess', `Exported ${selectedServers.length} server(s)`));
      }

      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportFailed', 'Failed to export configuration'));
    } finally {
      setExporting(false);
    }
  };

  const clientTypeOptions: { value: MCPClientType; label: string }[] = [
    { value: 'claude-desktop', label: 'Claude Desktop' },
    { value: 'vscode', label: 'VS Code' },
    { value: 'cursor', label: 'Cursor' },
    { value: 'windsurf', label: 'Windsurf' },
    { value: 'zed', label: 'Zed' },
    { value: 'cline', label: 'Cline' },
    { value: 'continue', label: 'Continue' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileJson className="mr-2 h-4 w-4" />
          {t('exportToIDE', 'Export to IDE')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('exportIDEConfig', 'Export to IDE Config')}</DialogTitle>
          <DialogDescription>
            {t('exportIDEConfigDesc', 'Export selected servers to an IDE-compatible configuration file')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('ideFormat', 'IDE Format')}</Label>
            <Select value={clientType} onValueChange={(v) => setClientType(v as MCPClientType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('selectServers', 'Select Servers')}</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {t('selectAll', 'Select All')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  {t('deselectAll', 'Deselect All')}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {servers.map((server) => (
                  <div key={server.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`server-${server.id}`}
                      checked={selectedServerIds.has(server.id)}
                      onCheckedChange={() => handleToggleServer(server.id)}
                    />
                    <label
                      htmlFor={`server-${server.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {server.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({server.transportType})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {t('serversSelected', { count: selectedServerIds.size }, `${selectedServerIds.size} server(s) selected`)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button onClick={handleExport} disabled={exporting || selectedServerIds.size === 0}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exporting', 'Exporting...')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('export', 'Export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


