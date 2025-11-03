'use client';

/**
 * Test Error Page
 * This page is used to test error boundaries and error handling
 * Remove this file in production
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { AlertTriangle } from 'lucide-react';

export default function TestErrorPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate error boundary functionality');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumbs items={[{ label: 'Test Error' }]} className="mb-6" />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Error Handling Test Page
            </CardTitle>
            <CardDescription>
              This page is for testing error boundaries and error handling. Click the button below to trigger an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Error Boundary</h3>
              <p className="text-sm text-muted-foreground">
                This will trigger the error boundary and display the error page.
              </p>
              <Button 
                onClick={() => setShouldThrow(true)} 
                variant="destructive"
              >
                Trigger Error
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Test 404 Page</h3>
              <p className="text-sm text-muted-foreground">
                Navigate to a non-existent page to see the 404 error page.
              </p>
              <Button 
                onClick={() => window.location.href = '/non-existent-page'} 
                variant="outline"
              >
                Go to Non-Existent Page
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Test Loading State</h3>
              <p className="text-sm text-muted-foreground">
                Navigate to a page with loading state to see the loading UI.
              </p>
              <Button 
                onClick={() => window.location.href = '/chat'} 
                variant="outline"
              >
                Go to Chat (with loading)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-warning">⚠️ Warning</CardTitle>
            <CardDescription>
              This page should be removed in production. It&apos;s only for testing error handling during development.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

