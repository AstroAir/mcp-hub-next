/**
 * Update Notification Component
 * Displays update notifications and progress in the UI
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { UpdateStatus } from '@/lib/types/tauri';
import { Download, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface UpdateNotificationProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function UpdateNotification({ onInstall, onDismiss }: UpdateNotificationProps) {
  const t = useTranslations('settings.updates');
  const tStatus = useTranslations('settings.updates.status');
  const tActions = useTranslations('settings.updates.actions');
  const tToasts = useTranslations('settings.updates.toasts');
  const tProgress = useTranslations('settings.updates.progress');

  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleInstall = useCallback(async () => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      try {
        await invoke('quit_and_install');
        onInstall?.();
      } catch (error) {
        console.error('Failed to quit and install:', error);
        toast.error(tToasts('installFailed'));
      }
    }
  }, [onInstall, tToasts]);

  const handleDownload = useCallback(async () => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      try {
        await invoke('download_update');
      } catch (error) {
        console.error('Failed to download update:', error);
        toast.error(tToasts('downloadFailed'));
      }
    }
  }, [tToasts]);

  useEffect(() => {
    // Check if running in Tauri
    if (typeof window === 'undefined' || !window.__TAURI__) {
      return;
    }

    // Listen for update status from Tauri
    const unlistenStatusPromise = listen<UpdateStatus>('update-status', (event) => {
      const statusData = event.payload;
      setStatus(statusData);

      switch (statusData.event) {
        case 'checking-for-update':
          setVisible(true);
          break;

        case 'update-available':
          setVisible(true);
          toast.success(tToasts('updateAvailable', { version: statusData.data?.version || '' }));
          break;

        case 'update-not-available':
          setVisible(false);
          // Don't show toast for "no update" unless manually triggered
          break;

        case 'download-progress':
          setVisible(true);
          setDownloadProgress(statusData.data?.percent || 0);
          break;

        case 'update-installing':
          setVisible(true);
          toast.info(tProgress('installing'));
          break;

        case 'update-downloaded':
          setVisible(true);
          toast.success(tToasts('updateDownloaded'));
          break;

        case 'update-error':
          toast.error(tToasts('updateError', { message: statusData.data?.message || 'Unknown error' }));
          setVisible(false);
          break;
      }
    });

    return () => {
      unlistenStatusPromise.then((unlisten) => unlisten());
    };
  }, [tToasts, tProgress]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || !status) {
    return null;
  }

  // Checking for update
  if (status.event === 'checking-for-update') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('checking')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Downloading - showing progress
  if (status.event === 'download-progress') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{tStatus('downloading')}</p>
              <p className="text-xs text-muted-foreground">
                {tStatus('downloadingMessage', { version: status.data?.version || '' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Progress value={downloadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {tProgress('downloading', { percent: Math.round(downloadProgress) })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Installing
  if (status.event === 'update-installing') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{tProgress('installing')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Update downloaded - ready to install
  if (status.event === 'update-downloaded') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{tStatus('downloadComplete')}</p>
              <p className="text-xs text-muted-foreground">
                {tStatus('downloadCompleteMessage', { version: status.data?.version || '' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleInstall}
            >
              {tActions('installNow')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
            >
              {tActions('installLater')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Update available - not yet downloaded
  if (status.event === 'update-available') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{tStatus('updateAvailable')}</p>
              <p className="text-xs text-muted-foreground">
                {tStatus('updateAvailableMessage', { version: status.data?.version || '' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {status.data?.body && (
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto whitespace-pre-wrap">
              {status.data.body}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              {tActions('download')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              {tActions('installLater')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
