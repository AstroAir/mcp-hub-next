'use client';

/**
 * Settings Page
 * Application settings and preferences
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BackupManagement } from '@/components/settings/backup-management';
import { Database, Trash2, Download, Upload, Info, FileJson, Files } from 'lucide-react';
import { toast } from 'sonner';

type ImportMode = 'single' | 'multiple';

export default function SettingsPage() {
  const [storageSize, setStorageSize] = useState<string>('0.00');
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared');
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const data = {
      servers: localStorage.getItem('mcp-servers'),
      connectionHistory: localStorage.getItem('mcp-connection-history'),
      chatSessions: localStorage.getItem('mcp-chat-sessions'),
      currentSession: localStorage.getItem('mcp-current-session'),
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
    <div className="container mx-auto py-8 px-4">
      <Breadcrumbs items={[{ label: 'Settings' }]} className="mb-6" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application settings and data
          </p>
        </div>

        {/* Storage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Information
            </CardTitle>
            <CardDescription>
              View information about your local storage usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Storage Used</span>
              <Badge variant="outline">{storageSize} KB</Badge>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Data is stored locally in your browser. Clearing browser data will remove all
                  server configurations and chat history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Management */}
        <BackupManagement />

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export, import, or clear your application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your data as a JSON file
                  </p>
                </div>
                <Button onClick={handleExportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-muted-foreground">
                    Restore data from backup file(s)
                  </p>
                </div>

                {/* Import Mode Selector */}
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
                  accept="application/json"
                  multiple={importMode === 'multiple'}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Import data file"
                />

                <Button onClick={handleImportData} variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {importMode === 'multiple' ? 'Select Files to Import' : 'Select File to Import'}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Clear All Data</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all servers, connections, and chat history
                  </p>
                </div>
                <Button onClick={handleClearData} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>
              Use these shortcuts to navigate faster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>New Server</span>
                <Badge variant="outline" className="font-mono">Ctrl/Cmd + N</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Go to Dashboard</span>
                <Badge variant="outline" className="font-mono">G then D</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Go to Chat</span>
                <Badge variant="outline" className="font-mono">G then C</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Go to Settings</span>
                <Badge variant="outline" className="font-mono">G then S</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About MCP Hub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              MCP Hub is a full-stack application for managing Model Context Protocol servers
              with integrated Claude chat functionality.
            </p>
            <p className="pt-2">
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Protocol Version:</strong> 2025-06-18
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

