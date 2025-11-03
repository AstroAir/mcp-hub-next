'use client';

/**
 * Developer Route Error Boundary
 * Catches and displays errors specific to the developer route
 */

import { useEffect } from 'react';
import { ErrorState } from '@/components/error/error-state';
import { Bug } from 'lucide-react';

export default function DeveloperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Developer page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title="Developer Tools Error"
        description="An error occurred while loading the developer tools."
        error={error}
        icon={Bug}
        onRetry={reset}
        showHomeButton={true}
        showRetryButton={true}
      />
    </div>
  );
}

