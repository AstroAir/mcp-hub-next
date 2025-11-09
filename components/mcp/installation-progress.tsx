'use client';

/**
 * Installation Progress Component
 * Displays real-time installation progress
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2, X, RotateCcw, LifeBuoy } from 'lucide-react';
import { installationAPI } from '@/lib/services/api-client';
import { useServerStore } from '@/lib/stores/server-store';
import type { InstallationProgress } from '@/lib/types';
import { getTroubleshootingTips } from '@/lib/utils/error-dedupe';

interface InstallationProgressProps {
  installId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onRetry?: () => void | Promise<void>;
}

export function InstallationProgressCard({ installId, onComplete, onError, onRetry }: InstallationProgressProps) {
  const [progress, setProgress] = useState<InstallationProgress | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { setInstallationProgress, removeInstallation } = useServerStore();
  const t = useTranslations('components.installationProgress');
  const actions = useTranslations('common.actions');
  const troubleshooting = useTranslations('components.troubleshooting');
  const alerts = useTranslations('components.installServer.alerts');
  const installErrors = useTranslations('components.installServer.errors');

  useEffect(() => {
    const fetchProgress = async (intervalRef: { current: NodeJS.Timeout | null }) => {
      try {
        const response = await installationAPI.getProgress(installId);

        if (response.success && response.data) {
          setProgress(response.data);
          setInstallationProgress(installId, response.data);

          // Check if completed or failed
          if (response.data.status === 'completed') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onComplete?.();
          } else if (response.data.status === 'failed') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onError?.(response.data.error || installErrors('installationFailed'));
          }
        }
      } catch (error) {
        console.error('Error fetching installation progress:', error);
      }
    };

    const intervalRef = { current: null as NodeJS.Timeout | null };

    // Initial fetch
    fetchProgress(intervalRef);

    // Poll every 2 seconds
    intervalRef.current = setInterval(() => fetchProgress(intervalRef), 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [installErrors, installId, onComplete, onError, setInstallationProgress]);

  const handleCancel = async () => {
    try {
      await installationAPI.cancel(installId);
      removeInstallation(installId);
    } catch (error) {
      console.error('Error cancelling installation:', error);
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 aria-hidden className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle aria-hidden className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 aria-hidden className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      downloading: 'default',
      installing: 'default',
      configuring: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'destructive',
    };

    const labelMap: Record<string, string> = {
      pending: t('status.pending'),
      downloading: t('status.downloading'),
      installing: t('status.installing'),
      configuring: t('status.configuring'),
      completed: t('status.completed'),
      failed: t('status.failed'),
      cancelled: t('status.cancelled'),
    };

    const label = labelMap[progress.status] ?? progress.status;

    return (
      <Badge variant={variants[progress.status] || 'default'}>
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{t('title')}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>{progress.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {progress.currentStep && progress.totalSteps
                ? t('progress.step', {
                    current: String(progress.currentStepNumber ?? 0),
                    total: String(progress.totalSteps ?? 0),
                    name: progress.currentStep,
                  })
                : t('progress.processing')}
            </span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} />
        </div>

        {/* Error Message + Guidance */}
        {progress.error && (
          <div className="space-y-3">
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <div className="font-semibold">{t('errorLabel')}</div>
              <div className="mt-1">{progress.error}</div>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <LifeBuoy className="h-4 w-4" aria-hidden /> {alerts('troubleshooting')}
              </div>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                {getTroubleshootingTips(progress.error).map((tipKey) => (
                  <li key={tipKey}>{troubleshooting(tipKey)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Logs */}
        {progress.logs && progress.logs.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? t('logs.hide') : t('logs.show')}
            </Button>

            {showLogs && (
              <ScrollArea className="h-48 rounded-md border bg-muted p-3">
                <pre className="text-xs font-mono">
                  {progress.logs.join('\n')}
                </pre>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            {t('timestamps.started', { value: new Date(progress.startedAt).toLocaleString() })}
            {progress.completedAt && (
              <>
                {' '}
                {t('timestamps.separator')}
                {' '}
                {t('timestamps.completed', { value: new Date(progress.completedAt).toLocaleString() })}
              </>
            )}
          </div>

          {progress.status !== 'completed' && progress.status !== 'failed' && progress.status !== 'cancelled' && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" aria-hidden />
              {actions('cancel')}
            </Button>
          )}
          {progress.status === 'failed' && onRetry && (
            <Button size="sm" onClick={handleRetry} disabled={retrying}>
              <RotateCcw className="h-4 w-4 mr-1" aria-hidden />
              {retrying ? t('actions.retrying') : actions('retry')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Installation Progress List Component
 * Shows all active installations
 */
export function InstallationProgressList() {
  const { installations } = useServerStore();
  const t = useTranslations('components.installationProgress');
  const activeInstallations = Object.entries(installations).filter(
    ([, progress]) => progress.status !== 'completed' && progress.status !== 'failed'
  );

  if (activeInstallations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('list.title')}</h3>
      {activeInstallations.map(([installId]) => (
        <InstallationProgressCard key={installId} installId={installId} />
      ))}
    </div>
  );
}

