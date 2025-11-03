/**
 * Update Notification Component
 * Displays update notifications and progress in the UI
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { toast } from 'sonner';

interface UpdateInfo {
  version?: string;
  releaseNotes?: string;
  percent?: number;
  message?: string;
}

interface UpdateStatus {
  event: 'checking-for-update' | 'update-available' | 'update-not-available' |
         'download-progress' | 'update-downloaded' | 'update-error';
  data?: UpdateInfo;
}

interface UpdateNotificationData {
  title: string;
  message: string;
  actions?: Array<{ label: string; action: string }>;
}

interface UpdateNotificationProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function UpdateNotification({ onInstall, onDismiss }: UpdateNotificationProps) {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const handleInstall = useCallback(() => {
    if (window.electronAPI?.quitAndInstall) {
      window.electronAPI.quitAndInstall();
    }
    onInstall?.();
  }, [onInstall]);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window === 'undefined' || !window.electronAPI) {
      return;
    }

    // Listen for update status from Electron
    const handleUpdateStatus = (...args: unknown[]) => {
      const statusData = args[1] as UpdateStatus;
      setStatus(statusData);

      switch (statusData.event) {
        case 'checking-for-update':
          toast.info('Checking for updates...');
          break;

        case 'update-available':
          setUpdateInfo(statusData.data || null);
          setVisible(true);
          toast.success(`Update available: v${statusData.data?.version}`);
          break;

        case 'update-not-available':
          // Silent - only show if manually triggered
          break;

        case 'download-progress':
          setDownloadProgress(statusData.data?.percent || 0);
          break;

        case 'update-downloaded':
          setUpdateInfo(statusData.data || null);
          setVisible(true);
          toast.success('Update downloaded and ready to install');
          break;

        case 'update-error':
          toast.error('Update error: ' + (statusData.data?.message || 'Unknown error'));
          setVisible(false);
          break;
      }
    };

    // Listen for custom update notifications
    const handleUpdateNotification = (...args: unknown[]) => {
      const notification = args[1] as UpdateNotificationData;
      const firstAction = notification.actions?.[0];
      toast(notification.message, {
        description: notification.title,
        action: firstAction ? {
          label: firstAction.label,
          onClick: () => {
            if (firstAction.action === 'install-now') {
              handleInstall();
            }
          },
        } : undefined,
      });
    };

    window.electronAPI.on('update-status', handleUpdateStatus);
    window.electronAPI.on('update-notification', handleUpdateNotification);

    return () => {
      if (window.electronAPI) {
        window.electronAPI.off('update-status', handleUpdateStatus);
        window.electronAPI.off('update-notification', handleUpdateNotification);
      }
    };
  }, [handleInstall]);

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
            <p className="text-sm font-medium">Checking for updates...</p>
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

  // Update available - downloading
  if (status.event === 'download-progress') {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Downloading update...</p>
              <p className="text-xs text-muted-foreground">
                Version {updateInfo?.version}
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
            <ProgressBar value={downloadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(downloadProgress)}%
            </p>
          </div>
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
              <p className="text-sm font-medium">Update ready to install</p>
              <p className="text-xs text-muted-foreground">
                Version {updateInfo?.version} has been downloaded
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
              Restart & Install
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
            >
              Later
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
              <p className="text-sm font-medium">Update available</p>
              <p className="text-xs text-muted-foreground">
                Version {updateInfo?.version} is ready to download
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
          {updateInfo?.releaseNotes && (
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {updateInfo.releaseNotes}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

