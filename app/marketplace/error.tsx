'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/error/error-state';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('marketplace.error');

  useEffect(() => {
    console.error('Marketplace error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ErrorState
        title={t('title')}
        description={error.message || t('description')}
        error={error}
        showRetryButton
        onRetry={reset}
      />
    </div>
  );
}

