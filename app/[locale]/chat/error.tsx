'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/error/error-state';
import { MessageSquare } from 'lucide-react';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('chat.error');

  useEffect(() => {
    console.error('Chat error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title={t('title')}
        description={error.message || t('description')}
        error={error}
        icon={MessageSquare}
        onRetry={reset}
        showHomeButton
        showRetryButton
      />
    </div>
  );
}
