'use client';

/**
 * Chat Route Error Boundary
 * Catches and displays errors specific to the chat route
 */

import { useEffect } from 'react';
import { ErrorState } from '@/components/error/error-state';
import { MessageSquare } from 'lucide-react';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Chat error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title="Chat Error"
        description="An error occurred while loading the chat interface."
        error={error}
        icon={MessageSquare}
        onRetry={reset}
        showHomeButton={true}
        showRetryButton={true}
      />
    </div>
  );
}

