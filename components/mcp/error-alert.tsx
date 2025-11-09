'use client';

/**
 * ErrorAlert Component
 * Displays error messages in a consistent format
 */

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ title, message, onDismiss }: ErrorAlertProps) {
  const t = useTranslations('components.errorAlert');
  const actions = useTranslations('common.actions');
  const resolvedTitle = title ?? t('title');

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {resolvedTitle}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
            aria-label={actions('close')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

