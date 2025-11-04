'use client';

/**
 * Settings Page
 * Application settings and preferences
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BackupManagement } from '@/components/settings/backup-management';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { LocaleSettings } from '@/components/settings/locale-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { PrivacySecuritySettings } from '@/components/settings/privacy-security-settings';
import { AdvancedSettings } from '@/components/settings/advanced-settings';
import { KeyboardShortcutsEditor } from '@/components/settings/keyboard-shortcuts-editor';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Database, Trash2, Download, Upload, Info, FileJson, Files, Keyboard, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

type ImportMode = 'single' | 'multiple';

export default function SettingsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { privacy } = useSettingsStore();
  const [storageSize, setStorageSize] = useState<string>('0.00');
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matches = (label: string) => {
    if (!search.trim()) return true;
    return label.toLowerCase().includes(search.trim().toLowerCase());
  };

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: 'Settings' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    // Calculate storage size only on client side
    const updateStorageSize = () => {
      if (typeof window !== 'undefined') {
        let total = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
          }
        }
        setStorageSize((total / 1024).toFixed(2));
      }
    };

    updateStorageSize();
  }, []);

  const handleClearData = () => {
    localStorage.clear();
    toast.success('All data cleared');
    setShowClearDataDialog(false);
    setTimeout(() => window.location.reload(), 500);
  };

  const handleExportData = () => {
    const data = {
      servers: localStorage.getItem('mcp-servers'),
      connectionHistory: localStorage.getItem('mcp-connection-history'),
      chatSessions: localStorage.getItem('mcp-chat-sessions'),
      currentSession: localStorage.getItem('mcp-current-session'),
      preferences: localStorage.getItem('mcp-preferences'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImportData = () => {
    // Trigger the file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const files = Array.from(selectedFiles);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.servers) localStorage.setItem('mcp-servers', data.servers);
        if (data.connectionHistory) localStorage.setItem('mcp-connection-history', data.connectionHistory);
        if (data.chatSessions) localStorage.setItem('mcp-chat-sessions', data.chatSessions);
  if (data.currentSession) localStorage.setItem('mcp-current-session', data.currentSession);
  if (data.preferences) localStorage.setItem('mcp-preferences', data.preferences);

        successCount++;
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        failCount++;
      }
    }

    // Reset input to allow re-selection of the same file
    e.target.value = '';

    // Show results
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully imported ${successCount} file(s)`);
      window.location.reload();
    } else if (successCount > 0 && failCount > 0) {
      toast.success(`Imported ${successCount} file(s), ${failCount} failed`);
      window.location.reload();
    } else {
      toast.error('Failed to import data. Invalid file format.');
    }
  };

  const resetImportMode = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage your application settings and preferences
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search settings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-md"
          />
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid lg:grid-cols-6 h-auto">
            <TabsTrigger value="general" className="gap-2 py-2.5">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 py-2.5">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data & Backup</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="gap-2 py-2.5">
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2 py-2.5">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2 py-2.5">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2 py-2.5">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* Appearance & Locale */}
            <div className="grid gap-6 lg:grid-cols-2">
              {matches('appearance theme color') && <AppearanceSettings />}
              {matches('language locale') && <LocaleSettings />}
            </div>

            {/* Notifications */}
            {matches('notification notifications sound badges alerts') && <NotificationSettings />}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Storage Information */}
              {matches('storage information local storage') && (
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Storage Information
                  </CardTitle>
                  <CardDescription>
                    View information about your local storage usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Storage Used</p>
                      <p className="text-2xl font-bold mt-1">{storageSize} KB</p>
                    </div>
                    <Database className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Data is stored locally in your browser. Clearing browser data will remove all
                      server configurations and chat history.
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Quick Actions */}
              {matches('quick actions export import clear') && (
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common data management operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 transition-all hover:bg-accent"
                  >
                    <Download className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Export Data</div>
                      <div className="text-xs text-muted-foreground">Download all your data as JSON</div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleImportData}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 transition-all hover:bg-accent"
                  >
                    <Upload className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Import Data</div>
                      <div className="text-xs text-muted-foreground">
                        {importMode === 'multiple' ? 'Restore from multiple files' : 'Restore from backup file'}
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() =>
                      privacy.requireConfirmOnClear ? setShowClearDataDialog(true) : handleClearData()
                    }
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Clear All Data</div>
                      <div className="text-xs opacity-80">Remove all servers and chat history</div>
                    </div>
                  </Button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    multiple={importMode === 'multiple'}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Import data file"
                  />
                </CardContent>
              </Card>
              )}
            </div>

            {/* Import Mode Selector */}
            {matches('import mode single multiple') && (
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Import Mode</CardTitle>
                <CardDescription>
                  Choose how you want to import backup files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={importMode}
                  onValueChange={(value: ImportMode) => {
                    setImportMode(value);
                    resetImportMode();
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="single" id="single" className="peer sr-only" />
                    <Label
                      htmlFor="single"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <FileJson className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-medium leading-none">Single File</p>
                        <p className="text-xs text-muted-foreground">Import one backup file at a time</p>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="multiple" id="multiple" className="peer sr-only" />
                    <Label
                      htmlFor="multiple"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Files className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-medium leading-none">Multiple Files</p>
                        <p className="text-xs text-muted-foreground">Import multiple backup files</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Data & Backup Tab */}
          <TabsContent value="data" className="space-y-6">
            <BackupManagement />
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-6">
            <KeyboardShortcutsEditor />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <PrivacySecuritySettings />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <AdvancedSettings />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    About MCP Hub
                  </CardTitle>
                  <CardDescription>
                    Application information and version details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    MCP Hub is a full-stack application for managing Model Context Protocol servers
                    with integrated Claude chat functionality.
                  </p>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Application Version</span>
                      <Badge variant="outline" className="font-mono">1.0.0</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Protocol Version</span>
                      <Badge variant="outline" className="font-mono">2025-06-18</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                  <CardDescription>
                    Helpful links and documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start transition-all hover:bg-accent"
                    asChild
                  >
                    <a href="https://github.com/modelcontextprotocol" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      MCP Documentation
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start transition-all hover:bg-accent"
                    asChild
                  >
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      GitHub Repository
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Clear Data Confirmation Dialog */}
        <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All server configurations</li>
                  <li>Connection history</li>
                  <li>Chat sessions and messages</li>
                  <li>Application settings</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

