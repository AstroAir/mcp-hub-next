'use client';

/**
 * Developer Route Error Boundary
 * Catches and displays errors specific to the developer route
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/error/error-state';
import { Code } from 'lucide-react';

export default function DeveloperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('developerPage.error');

  useEffect(() => {
    console.error('Developer page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title={t('title')}
        description={error.message || t('description')}
        error={error}
        icon={Code}
        onRetry={reset}
        showHomeButton
        showRetryButton
      />
    </div>
  );
}

