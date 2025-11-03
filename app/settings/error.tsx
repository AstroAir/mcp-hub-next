'use client';

/**
 * Settings Route Error Boundary
 * Catches and displays errors specific to the settings route
 */

import { useEffect } from 'react';
import { ErrorState } from '@/components/error/error-state';
import { Settings } from 'lucide-react';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Settings page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title="Settings Error"
        description="An error occurred while loading the settings page."
        error={error}
        icon={Settings}
        onRetry={reset}
        showHomeButton={true}
        showRetryButton={true}
      />
    </div>
  );
}

