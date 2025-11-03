'use client';

/**
 * BackupManagement Component
 * Manages automatic backups, backup history, and restore functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Archive, Clock, Download, RotateCcw, Trash2, Upload, HardDrive, FileJson, Files } from 'lucide-react';
import { toast } from 'sonner';

type ImportMode = 'single' | 'multiple';
import {
  getBackupSettings,
  saveBackupSettings,
  createBackup,
  getBackupHistory,
  restoreBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  type BackupSettings,
  type BackupMetadata,
} from '@/lib/services/backup-service';

export function BackupManagement() {
  const [settings, setSettings] = useState<BackupSettings>({
    enabled: false,
    frequency: 'weekly',
    retentionDays: 30,
  });
  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreOptions, setRestoreOptions] = useState({
    servers: true,
    chatSessions: true,
    chatMessages: true,
    connectionHistory: true,
    settings: true,
  });
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(() => {
    const stored = getBackupSettings();
    setSettings(stored);
  }, []);

  const loadBackupHistory = useCallback(() => {
    const history = getBackupHistory();
    setBackupHistory(history.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, []);

  useEffect(() => {
    // Initial load using microtask to avoid synchronous setState
    Promise.resolve().then(() => {
      loadSettings();
      loadBackupHistory();
    });
  }, [loadSettings, loadBackupHistory]);

  const handleSettingsChange = (key: keyof BackupSettings, value: boolean | number | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveBackupSettings(newSettings);
    toast.success('Backup settings updated');
  };

  const handleCreateBackup = () => {
    try {
      createBackup();
      loadBackupHistory();
      toast.success('Backup created successfully');
    } catch (error) {
      toast.error('Failed to create backup');
      console.error(error);
    }
  };

  const handleExportBackup = (backupId: string) => {
    try {
      exportBackup(backupId);
      toast.success('Backup exported');
    } catch (error) {
      toast.error('Failed to export backup');
      console.error(error);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const files = Array.from(selectedFiles);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await importBackup(file);
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        failCount++;
      }
    }

    // Reset input to allow re-selection
    e.target.value = '';

    // Reload history and show results
    loadBackupHistory();

    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully imported ${successCount} backup(s)`);
    } else if (successCount > 0 && failCount > 0) {
      toast.success(`Imported ${successCount} backup(s), ${failCount} failed`);
    } else {
      toast.error('Failed to import backup(s)');
    }
  };

  const resetImportMode = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreBackup = () => {
    if (!selectedBackup) return;

    try {
      const success = restoreBackup(selectedBackup.id, restoreOptions);
      if (success) {
        toast.success('Backup restored successfully. Please refresh the page.');
        setShowRestoreDialog(false);
        setSelectedBackup(null);
      } else {
        toast.error('Failed to restore backup');
      }
    } catch (error) {
      toast.error('Failed to restore backup');
      console.error(error);
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;

    try {
      deleteBackup(backupId);
      loadBackupHistory();
      toast.success('Backup deleted');
    } catch (error) {
      toast.error('Failed to delete backup');
      console.error(error);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Automatic Backups
          </CardTitle>
          <CardDescription>
            Configure automatic backup schedule and retention policy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create backups based on schedule
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Backup Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value) => handleSettingsChange('frequency', value)}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Retention Period (days)</Label>
            <Select
              value={settings.retentionDays.toString()}
              onValueChange={(value) => handleSettingsChange('retentionDays', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Backups older than this will be automatically deleted
            </p>
          </div>

          {settings.lastBackupTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last backup: {formatDate(settings.lastBackupTime)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Backup</CardTitle>
          <CardDescription>
            Create, import, or export backups manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCreateBackup} className="flex-1">
              <Archive className="h-4 w-4 mr-2" />
              Create Backup Now
            </Button>
          </div>

          <Separator />

          {/* Import Mode Selector */}
          <div className="space-y-3">
            <Label>Import Backup(s)</Label>
            <div className="flex gap-2">
              <Button
                variant={importMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setImportMode('single');
                  resetImportMode();
                }}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Single File
              </Button>
              <Button
                variant={importMode === 'multiple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setImportMode('multiple');
                  resetImportMode();
                }}
                className="flex-1"
              >
                <Files className="h-4 w-4 mr-2" />
                Multiple Files
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple={importMode === 'multiple'}
              onChange={handleImportBackup}
              className="hidden"
              aria-label="Import backup file"
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMode === 'multiple' ? 'Select Backup Files' : 'Select Backup File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Backup History</span>
            <Badge variant="secondary">{backupHistory.length} backups</Badge>
          </CardTitle>
          <CardDescription>
            View and manage your backup history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups yet</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {backupHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        <span className="font-medium">{formatDate(backup.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatSize(backup.size)}</span>
                        <span>•</span>
                        <span>{backup.itemCounts.servers} servers</span>
                        <span>•</span>
                        <span>{backup.itemCounts.chatSessions} sessions</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreDialog(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              Select which data to restore from this backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(restoreOptions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, [key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestoreBackup}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

