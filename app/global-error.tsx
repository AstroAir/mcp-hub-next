'use client';

/**
 * Global Error Boundary
 * Catches errors in the root layout and provides a fallback UI
 * This is a special error boundary that wraps the entire application
 */

import { useEffect, useMemo, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { locales, defaultLocale, type Locale } from '@/i18n/routing';
import enMessages from '@/messages/en.json';
import zhCnMessages from '@/messages/zh-CN.json';

const messagesByLocale: Record<Locale, Record<string, unknown>> = {
  en: enMessages,
  'zh-CN': zhCnMessages,
};

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('globalErrorPage');

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl">{t('title')}</CardTitle>
          <CardDescription className="text-base mt-2">{t('description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <span className="font-semibold">{t('labels.error')}</span> {error.message || t('fallbackMessage')}
            </AlertDescription>
          </Alert>

          {error.digest && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
              <span className="font-semibold">{t('labels.errorId')}</span> {error.digest}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>{t('instructions.intro')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>{t('instructions.refresh')}</li>
              <li>{t('instructions.clearCache')}</li>
              <li>{t('instructions.contact')}</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button onClick={reset} variant="default" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('actions.reload')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Log error to console for debugging
    console.error('Global application error:', error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error);
    }
  }, [error]);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }
    const navigatorLocale = navigator.language;
    const matched = locales.find((candidate) => navigatorLocale.startsWith(candidate));
    if (matched) {
      setLocale(matched);
    }
  }, []);

  const messages = useMemo(() => messagesByLocale[locale] ?? messagesByLocale[defaultLocale], [locale]);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}>
          <GlobalErrorContent error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

