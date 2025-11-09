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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Archive, Clock, Download, RotateCcw, Trash2, Upload, HardDrive, FileJson, Files } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useFormatter } from 'next-intl';

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

const defaultRestoreOptions = {
  servers: true,
  chatSessions: true,
  chatMessages: true,
  connectionHistory: true,
  settings: true,
};

type RestoreOptionKey = keyof typeof defaultRestoreOptions;

const restoreOptionKeys: RestoreOptionKey[] = [
  'servers',
  'chatSessions',
  'chatMessages',
  'connectionHistory',
  'settings',
];

export function BackupManagement() {
  const t = useTranslations('settings.backup');
  const toastT = useTranslations('settings.backup.toasts');
  const formatter = useFormatter();
  const [settings, setSettings] = useState<BackupSettings>({
    enabled: false,
    frequency: 'weekly',
    retentionDays: 30,
  });
  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState(() => ({ ...defaultRestoreOptions }));
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frequencyOptions: BackupSettings['frequency'][] = ['daily', 'weekly', 'monthly', 'manual'];
  const retentionOptions = [7, 14, 30, 60, 90];
  const tAny: (key: string, values?: Record<string, unknown>) => string = t as unknown as (key: string, values?: Record<string, unknown>) => string;

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
    toast.success(toastT('settingsUpdated'));
  };

  const handleCreateBackup = () => {
    try {
      createBackup();
      loadBackupHistory();
      toast.success(toastT('createSuccess'));
    } catch (error) {
      toast.error(toastT('createError'));
      console.error(error);
    }
  };

  const handleExportBackup = (backupId: string) => {
    try {
      exportBackup(backupId);
      toast.success(toastT('exportSuccess'));
    } catch (error) {
      toast.error(toastT('exportError'));
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
      toast.success(toastT('importSuccess', { count: successCount }));
    } else if (successCount > 0 && failCount > 0) {
      toast.success(toastT('importPartial', { success: String(successCount), failed: String(failCount) }));
    } else {
      toast.error(toastT('importError'));
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
        toast.success(toastT('restoreSuccess'));
        setShowRestoreDialog(false);
        setSelectedBackup(null);
      } else {
        toast.error(toastT('restoreError'));
      }
    } catch (error) {
      toast.error(toastT('restoreError'));
      console.error(error);
    }
  };

  const handleDeleteBackup = () => {
    if (!backupToDelete) return;

    try {
      deleteBackup(backupToDelete);
      loadBackupHistory();
      toast.success(toastT('deleteSuccess'));
      setShowDeleteDialog(false);
      setBackupToDelete(null);
    } catch (error) {
      toast.error(toastT('deleteError'));
      console.error(error);
    }
  };

  const formatDate = useCallback(
    (timestamp: string) =>
      formatter.dateTime(new Date(timestamp), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [formatter]
  );

  const formatSize = useCallback(
    (bytes: number) =>
      t('format.size', {
        value: formatter.number(bytes / 1024, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
      }),
    [formatter, t]
  );

  return (
    <div className="space-y-6">
      {/* Backup Settings */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            {t('sections.automatic.title')}
          </CardTitle>
          <CardDescription>{t('sections.automatic.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base">{t('sections.automatic.enable.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('sections.automatic.enable.description')}</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
            />
          </div>

          <Separator />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="frequency" className="text-base">{t('sections.automatic.frequency.label')}</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value) => handleSettingsChange('frequency', value)}
                disabled={!settings.enabled}
              >
                <SelectTrigger id="frequency" className="transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`sections.automatic.frequency.options.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="retention" className="text-base">{t('sections.automatic.retention.label')}</Label>
              <Select
                value={settings.retentionDays.toString()}
                onValueChange={(value) => handleSettingsChange('retentionDays', parseInt(value))}
              >
                <SelectTrigger id="retention" className="transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {retentionOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {tAny(`sections.automatic.retention.options.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('sections.automatic.retention.description')}</p>
            </div>
          </div>

          {settings.lastBackupTime && (
            <>
              <Separator />
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-900 dark:text-blue-100">
                  {t('sections.automatic.lastBackup', { time: formatDate(settings.lastBackupTime) })}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            {t('sections.manual.title')}
          </CardTitle>
          <CardDescription>{t('sections.manual.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button
            onClick={handleCreateBackup}
            className="w-full h-auto py-4 transition-all hover:shadow-md"
            size="lg"
          >
            <Archive className="h-5 w-5 mr-2" />
            {t('sections.manual.create')}
          </Button>

          <Separator />

          {/* Import Mode Selector */}
          <div className="space-y-4">
            <Label className="text-base">{t('sections.manual.import.label')}</Label>
            <RadioGroup
              value={importMode}
              onValueChange={(value: ImportMode) => {
                setImportMode(value);
                resetImportMode();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="single" id="backup-single" className="peer sr-only" />
                <Label
                  htmlFor="backup-single"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <FileJson className="mb-3 h-6 w-6" />
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium leading-none">{t('sections.manual.import.modes.single.title')}</p>
                    <p className="text-xs text-muted-foreground">{t('sections.manual.import.modes.single.description')}</p>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="multiple" id="backup-multiple" className="peer sr-only" />
                <Label
                  htmlFor="backup-multiple"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Files className="mb-3 h-6 w-6" />
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium leading-none">{t('sections.manual.import.modes.multiple.title')}</p>
                    <p className="text-xs text-muted-foreground">{t('sections.manual.import.modes.multiple.description')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple={importMode === 'multiple'}
              onChange={handleImportBackup}
              className="hidden"
              aria-label={t('sections.manual.import.ariaLabel')}
            />

            <Button
              variant="outline"
              className="w-full transition-all hover:bg-accent"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMode === 'multiple'
                ? t('sections.manual.import.button.multiple')
                : t('sections.manual.import.button.single')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              {t('sections.history.title')}
            </span>
            <Badge variant="secondary" className="text-sm">{t('sections.history.badge', { count: backupHistory.length })}</Badge>
          </CardTitle>
          <CardDescription>{t('sections.history.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <HardDrive className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">{t('sections.history.empty.title')}</p>
              <p className="text-sm mt-1">{t('sections.history.empty.description')}</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {backupHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-all hover:shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatDate(backup.timestamp)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatSize(backup.size)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{backup.itemCounts.servers}</span> {t('cards.servers', { count: backup.itemCounts.servers })}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{backup.itemCounts.chatSessions}</span> {t('cards.sessions', { count: backup.itemCounts.chatSessions })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreDialog(true);
                        }}
                        className="transition-all hover:bg-primary hover:text-primary-foreground"
                        aria-label={t('actions.restore')}
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('actions.restore')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportBackup(backup.id)}
                        className="transition-all hover:bg-accent"
                        aria-label={t('actions.export')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBackupToDelete(backup.id);
                          setShowDeleteDialog(true);
                        }}
                        className="transition-all hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={t('actions.delete')}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              {t('dialogs.restore.title')}
            </DialogTitle>
            <DialogDescription>{t('dialogs.restore.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {restoreOptionKeys.map((key) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-all hover:bg-muted">
                <Label htmlFor={key} className="cursor-pointer">
                  {t(`dialogs.restore.options.${key}`)}
                </Label>
                <Switch
                  id={key}
                  checked={restoreOptions[key]}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, [key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              {t('dialogs.restore.cancel')}
            </Button>
            <Button onClick={handleRestoreBackup} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('dialogs.restore.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.delete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDelete(null)}>{t('dialogs.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dialogs.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

