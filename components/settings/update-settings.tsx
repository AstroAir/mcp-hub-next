/**
 * Update Settings Component
 * Allows users to configure auto-update preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { UpdatePreferences, UpdateStatus } from '@/lib/types/tauri';
import { Download, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function UpdateSettings() {
  const [preferences, setPreferences] = useState<UpdatePreferences>({
    autoDownload: true,
    autoInstallOnAppQuit: true,
    channel: 'stable',
    checkOnStartup: true,
  });
  const [checking, setChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('0.1.0');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    // Check if running in Tauri
    if (typeof window === 'undefined' || !window.__TAURI__) {
      return;
    }

    // Load current preferences from Tauri
    invoke<UpdatePreferences>('get_update_preferences')
      .then((prefs) => {
        setPreferences(prefs);
      })
      .catch((error) => {
        console.error('Failed to get update preferences:', error);
      });

    // Get current app version
    invoke<string>('get_app_version')
      .then((version) => {
        setCurrentVersion(version);
      })
      .catch((error) => {
        console.error('Failed to get app version:', error);
      });

    // Get update status
    invoke<UpdateStatus | null>('get_update_status')
      .then((status) => {
        if (status) {
          setUpdateStatus(status);
        }
      })
      .catch((error) => {
        console.error('Failed to get update status:', error);
      });

    // Listen for update status changes
    const unlistenPromise = listen<UpdateStatus>('update-status', (event) => {
      const status = event.payload;
      setUpdateStatus(status);
      if (status.event === 'checking-for-update') {
        setChecking(true);
      } else {
        setChecking(false);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handlePreferenceChange = (key: keyof UpdatePreferences, value: string | boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to Tauri
    if (typeof window !== 'undefined' && window.__TAURI__) {
      invoke('set_update_preferences', { preferences: newPreferences })
        .then(() => {
          toast.success('Update preferences saved');
        })
        .catch((error) => {
          console.error('Failed to save preferences:', error);
          toast.error('Failed to save preferences');
        });
    }
  };

  const handleCheckForUpdates = async () => {
    if (typeof window === 'undefined' || !window.__TAURI__) {
      toast.error('Update check not available in browser mode');
      return;
    }

    setChecking(true);
    try {
      await invoke('check_for_updates');
    } catch (error) {
      console.error('Error checking for updates:', error);
      toast.error('Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  const formatLastCheckTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Current Version */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Application Version</h3>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Current Version</p>
            <p className="text-2xl font-bold">{currentVersion}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last checked: {formatLastCheckTime(preferences.lastCheckTime)}
            </p>
          </div>
          <Button
            onClick={handleCheckForUpdates}
            disabled={checking}
            variant="outline"
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check for Updates
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Update Status */}
      {updateStatus?.updateDownloaded && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Update Ready
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                A new version has been downloaded and will be installed when you restart the application.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Update Channel */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="update-channel">Update Channel</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Choose which type of updates you want to receive
          </p>
        </div>
        <Select
          value={preferences.channel}
          onValueChange={(value) => handlePreferenceChange('channel', value)}
        >
          <SelectTrigger id="update-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable">
              <div className="flex flex-col items-start">
                <span className="font-medium">Stable</span>
                <span className="text-xs text-muted-foreground">
                  Recommended for most users
                </span>
              </div>
            </SelectItem>
            <SelectItem value="beta">
              <div className="flex flex-col items-start">
                <span className="font-medium">Beta</span>
                <span className="text-xs text-muted-foreground">
                  Get early access to new features
                </span>
              </div>
            </SelectItem>
            <SelectItem value="alpha">
              <div className="flex flex-col items-start">
                <span className="font-medium">Alpha</span>
                <span className="text-xs text-muted-foreground">
                  Bleeding edge (may be unstable)
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-download Updates */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-download">Automatically download updates</Label>
          <p className="text-xs text-muted-foreground">
            Download updates in the background when available
          </p>
        </div>
        <Switch
          id="auto-download"
          checked={preferences.autoDownload}
          onCheckedChange={(checked) => handlePreferenceChange('autoDownload', checked)}
        />
      </div>

      {/* Auto-install on Quit */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-install">Install updates on quit</Label>
          <p className="text-xs text-muted-foreground">
            Automatically install downloaded updates when you quit the app
          </p>
        </div>
        <Switch
          id="auto-install"
          checked={preferences.autoInstallOnAppQuit}
          onCheckedChange={(checked) => handlePreferenceChange('autoInstallOnAppQuit', checked)}
        />
      </div>

      {/* Check on Startup */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="check-startup">Check for updates on startup</Label>
          <p className="text-xs text-muted-foreground">
            Automatically check for updates when the app starts
          </p>
        </div>
        <Switch
          id="check-startup"
          checked={preferences.checkOnStartup}
          onCheckedChange={(checked) => handlePreferenceChange('checkOnStartup', checked)}
        />
      </div>

      {/* Information */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Updates are delivered securely using code-signed packages. The app will
              verify the authenticity of updates before installing them.
            </p>
            <p>
              You can always check for updates manually using the button above, regardless
              of your automatic update settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
