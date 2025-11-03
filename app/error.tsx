'use client';

/**
 * Error Boundary
 * Catches and displays errors in the application
 */

import { useEffect } from 'react';
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
          <CardTitle className="text-3xl">Something went wrong!</CardTitle>
          <CardDescription className="text-base mt-2">
            We encountered an unexpected error while processing your request.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <span className="font-semibold">Error:</span> {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          {error.digest && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
              <span className="font-semibold">Error ID:</span> {error.digest}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>This error has been logged. You can try the following:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Refresh the page or try again</li>
              <li>Go back to the dashboard</li>
              <li>Report this issue if it persists</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button onClick={handleReportIssue} variant="ghost" className="w-full sm:w-auto">
            <Bug className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

