'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/error/error-state';
import { Server } from 'lucide-react';

export default function ServersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('servers.error');

  useEffect(() => {
    console.error('Servers page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title={t('title')}
        description={error.message || t('description')}
        error={error}
        icon={Server}
        onRetry={reset}
        showHomeButton
        showRetryButton
      />
    </div>
  );
}

