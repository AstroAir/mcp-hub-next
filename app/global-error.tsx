'use client';

/**
 * Global Error Boundary
 * Catches errors in the root layout and provides a fallback UI
 * This is a special error boundary that wraps the entire application
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global application error:', error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-3xl">Critical Error</CardTitle>
              <CardDescription className="text-base mt-2">
                A critical error occurred that prevented the application from loading properly.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <span className="font-semibold">Error:</span> {error.message || 'An unexpected critical error occurred'}
                </AlertDescription>
              </Alert>

              {error.digest && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
                  <span className="font-semibold">Error ID:</span> {error.digest}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>This is a critical error that affected the entire application. Please try:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>Refreshing the page</li>
                  <li>Clearing your browser cache</li>
                  <li>Contacting support if the issue persists</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button onClick={reset} variant="default" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}

