'use client';

/**
 * ErrorState Component
 * Reusable error state component for displaying errors in different contexts
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  icon?: LucideIcon;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while processing your request.',
  error,
  icon: Icon = AlertCircle,
  showHomeButton = true,
  showRetryButton = true,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={className}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <Icon className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        
        {errorMessage && (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetryButton && onRetry && (
            <Button onClick={onRetry} variant="default" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

