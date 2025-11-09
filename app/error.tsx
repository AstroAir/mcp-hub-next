'use client';

/**
 * Error Boundary
 * Catches and displays errors in the application
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Home, RefreshCw, Bug } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const t = useTranslations('errorPage');

  useEffect(() => {
    // Log error to console for debugging
  console.error('Application error:', error);

    // In production, you could send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleReportIssue = () => {
    // Open GitHub issues or support email
    const issueTitle = encodeURIComponent(`Error: ${error.message}`);
    const issueBody = encodeURIComponent(
      `**Error Message:**\n${error.message}\n\n**Error Digest:**\n${error.digest || 'N/A'}\n\n**Stack Trace:**\n${error.stack || 'N/A'}`
    );
    window.open(
      `https://github.com/modelcontextprotocol/mcp-hub-next/issues/new?title=${issueTitle}&body=${issueBody}`,
      '_blank'
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl">{t('title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
              <li>{t('instructions.dashboard')}</li>
              <li>{t('instructions.report')}</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('actions.retry')}
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" />
            {t('actions.dashboard')}
          </Button>
          <Button onClick={handleReportIssue} variant="ghost" className="w-full sm:w-auto">
            <Bug className="h-4 w-4 mr-2" />
            {t('actions.report')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

