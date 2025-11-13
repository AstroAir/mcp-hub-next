/**
 * Update Settings Component
 * Allows users to configure auto-update preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { UpdatePreferences, UpdateStatus } from '@/lib/types/tauri';
import { Download, RefreshCw, Info, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function UpdateSettings() {
  const t = useTranslations('settings.updates');
  const tToasts = useTranslations('settings.updates.toasts');
  const tStatus = useTranslations('settings.updates.status');
  const tActions = useTranslations('settings.updates.actions');
  const tProgress = useTranslations('settings.updates.progress');
  const tTime = useTranslations('settings.updates.time');

  const [preferences, setPreferences] = useState<UpdatePreferences>({
    autoDownload: true,
    autoInstallOnAppQuit: true,
    channel: 'stable',
    checkOnStartup: true,
  });
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('0.1.0');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

      switch (status.event) {
        case 'checking-for-update':
          setChecking(true);
          setDownloading(false);
          break;

        case 'update-available':
          setChecking(false);
          if (!preferences.autoDownload) {
            toast.success(tToasts('updateAvailable', { version: status.data?.version || '' }));
          }
          break;

        case 'update-not-available':
          setChecking(false);
          setDownloading(false);
          toast.success(tToasts('noUpdateAvailable'));
          break;

        case 'download-progress':
          setChecking(false);
          setDownloading(true);
          setDownloadProgress(status.data?.percent || 0);
          break;

        case 'update-installing':
          setDownloading(false);
          toast.info(tProgress('installing'));
          break;

        case 'update-downloaded':
          setChecking(false);
          setDownloading(false);
          setDownloadProgress(100);
          toast.success(tToasts('updateDownloaded'));
          break;

        case 'update-error':
          setChecking(false);
          setDownloading(false);
          toast.error(tToasts('updateError', { message: status.data?.message || 'Unknown error' }));
          break;
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [preferences.autoDownload, tToasts, tProgress]);

  const handlePreferenceChange = (key: keyof UpdatePreferences, value: string | boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to Tauri
    if (typeof window !== 'undefined' && window.__TAURI__) {
      invoke('set_update_preferences', { preferences: newPreferences })
        .then(() => {
          toast.success(tToasts('preferencesSaved'));
        })
        .catch((error) => {
          console.error('Failed to save preferences:', error);
          toast.error(tToasts('preferencesFailed'));
        });
    }
  };

  const handleCheckForUpdates = async () => {
    if (typeof window === 'undefined' || !window.__TAURI__) {
      toast.error(tToasts('notAvailableInBrowser'));
      return;
    }

    setChecking(true);
    try {
      await invoke('check_for_updates');
    } catch (error) {
      console.error('Error checking for updates:', error);
      toast.error(tToasts('checkFailed'));
      setChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (typeof window === 'undefined' || !window.__TAURI__) {
      toast.error(tToasts('notAvailableInBrowser'));
      return;
    }

    setDownloading(true);
    try {
      await invoke('download_update');
    } catch (error) {
      console.error('Error downloading update:', error);
      toast.error(tToasts('downloadFailed'));
      setDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (typeof window === 'undefined' || !window.__TAURI__) {
      toast.error(tToasts('notAvailableInBrowser'));
      return;
    }

    try {
      await invoke('quit_and_install');
    } catch (error) {
      console.error('Error installing update:', error);
      toast.error(tToasts('installFailed'));
    }
  };

  const formatLastCheckTime = (timestamp?: number) => {
    if (!timestamp) return tTime('never');
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tTime('justNow');
    if (diffMins < 60) return tTime('minutesAgo', { minutes: diffMins });
    if (diffHours < 24) return tTime('hoursAgo', { hours: diffHours });
    if (diffDays < 7) return tTime('daysAgo', { days: diffDays });
    return date.toLocaleDateString();
  };

  const isUpdateAvailable = updateStatus?.event === 'update-available';
  const isUpdateDownloaded = updateStatus?.updateDownloaded === true;
  const releaseNotes = updateStatus?.data?.body || updateStatus?.data?.releaseNotes;

  return (
    <div className="space-y-6">
      {/* Current Version */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">{t('currentVersion')}</p>
            <p className="text-2xl font-bold">{currentVersion}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lastChecked', { time: formatLastCheckTime(preferences.lastCheckTime) })}
            </p>
          </div>
          <Button
            onClick={handleCheckForUpdates}
            disabled={checking || downloading}
            variant="outline"
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('checking')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('checkForUpdates')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Update Available */}
      {isUpdateAvailable && !isUpdateDownloaded && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {tStatus('updateAvailable')}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {tStatus('updateAvailableMessage', { version: updateStatus.data?.version || '' })}
                </p>
              </div>

              {/* Release Notes */}
              {releaseNotes && (
                <Collapsible open={showReleaseNotes} onOpenChange={setShowReleaseNotes}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100">
                      {tActions('viewReleaseNotes')}
                      {showReleaseNotes ? (
                        <ChevronUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ChevronDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="rounded-md bg-blue-100 dark:bg-blue-900 p-3 text-xs text-blue-900 dark:text-blue-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {releaseNotes}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Download Progress */}
              {downloading && (
                <div className="space-y-1">
                  <Progress value={downloadProgress} className="h-2" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {tProgress('downloading', { percent: Math.round(downloadProgress) })}
                  </p>
                </div>
              )}

              {/* Download Button */}
              {!preferences.autoDownload && !downloading && (
                <Button
                  onClick={handleDownloadUpdate}
                  size="sm"
                  className="mt-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {tActions('download')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Downloaded and Ready */}
      {isUpdateDownloaded && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {tStatus('downloadComplete')}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {tStatus('downloadCompleteMessage', { version: updateStatus?.data?.version || '' })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallUpdate}
                  size="sm"
                  variant="default"
                >
                  {tActions('installNow')}
                </Button>
                {!preferences.autoInstallOnAppQuit && (
                  <Button
                    onClick={() => setUpdateStatus(null)}
                    size="sm"
                    variant="outline"
                  >
                    {tActions('installLater')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Channel */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="update-channel">{t('updateChannel.title')}</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {t('updateChannel.description')}
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
                <span className="font-medium">{t('updateChannel.options.stable.label')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('updateChannel.options.stable.description')}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="beta">
              <div className="flex flex-col items-start">
                <span className="font-medium">{t('updateChannel.options.beta.label')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('updateChannel.options.beta.description')}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="alpha">
              <div className="flex flex-col items-start">
                <span className="font-medium">{t('updateChannel.options.alpha.label')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('updateChannel.options.alpha.description')}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-download Updates */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-download">{t('autoDownload.label')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('autoDownload.description')}
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
          <Label htmlFor="auto-install">{t('installOnQuit.label')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('installOnQuit.description')}
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
          <Label htmlFor="check-startup">{t('checkOnStartup.label')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('checkOnStartup.description')}
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
            <p>{t('info.description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
