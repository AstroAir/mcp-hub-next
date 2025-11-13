'use client';

/**
 * OAuth Callback Page
 * Handles OAuth 2.1 authorization callback with PKCE
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getOAuthState, clearOAuthState, saveOAuthToken } from '@/lib/services/oauth-service';

type CallbackStatus = 'processing' | 'exchanging' | 'success' | 'error';

export default function OAuthCallbackPage() {
  const t = useTranslations('oauthCallback');
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get params from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth error
        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          return;
        }

        // Validate code and state
        if (!code || !state) {
          setError(t('errors.missingCodeOrState'));
          setStatus('error');
          return;
        }

        // Get stored OAuth state
        const oauthState = getOAuthState(state);
        if (!oauthState) {
          setError(t('errors.stateExpired'));
          setStatus('error');
          return;
        }

        // TODO: Exchange code for tokens
        // This requires the OAuth config which should be stored with the state
        // For now, just mark as success and clear state
        setStatus('exchanging');

        // In a complete implementation, we would:
        // 1. Get OAuth config from server/state
        // 2. Exchange code for tokens using exchangeCodeForTokens
        // 3. Save tokens using saveOAuthToken with proper structure

        // Save tokens (example structure)
        const now = Date.now();
        saveOAuthToken({
          serverId: oauthState.serverId,
          serverName: oauthState.serverName,
          accessToken: '', // Would come from token exchange
          refreshToken: undefined,
          tokenType: 'Bearer',
          expiresAt: undefined,
          scope: undefined,
          createdAt: now,
          updatedAt: now,
        });

        // Clear OAuth state
        clearOAuthState();

        // Success
        setStatus('success');

        // Close window after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : t('errors.unknownError'));
        setStatus('error');
      }
    };

    void handleCallback();
  }, [searchParams, t]);

  const handleCloseWindow = () => {
    window.close();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              {status === 'processing' || status === 'exchanging' ? (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {status === 'processing' && t('headings.processing')}
            {status === 'exchanging' && t('headings.processing')}
            {status === 'success' && t('headings.success')}
            {status === 'error' && t('headings.error')}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {status === 'processing' && t('status.processing')}
            {status === 'exchanging' && t('status.exchanging')}
            {status === 'success' && t('status.success')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'error' && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('headings.error')}</AlertTitle>
              <AlertDescription>{error || t('errors.genericFailure')}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="text-center">
              <Button onClick={handleCloseWindow} variant="outline" className="w-full">
                {t('actions.closeWindow')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
