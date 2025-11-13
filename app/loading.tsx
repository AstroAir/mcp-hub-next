/**
 * Loading Page
 * Displayed while pages are loading
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  const t = useTranslations('loadingState');

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{t('title')}</h3>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
            <div className="w-full space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

