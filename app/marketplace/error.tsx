'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/error/error-state';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketplace error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ErrorState
        title="Something went wrong in the marketplace"
        description={error.message || 'An unexpected error occurred'}
        error={error}
        showRetryButton
        onRetry={reset}
      />
    </div>
  );
}

