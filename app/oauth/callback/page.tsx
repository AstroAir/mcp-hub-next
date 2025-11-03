'use client';

/**
 * OAuth Callback Page
 * Handles OAuth 2.1 callback and token exchange
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  getOAuthState,
  clearOAuthState,
  exchangeCodeForTokens,
  saveOAuthToken,
} from '@/lib/services/oauth-service';
import type { OAuthConfig } from '@/lib/types/oauth';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors
        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Get stored OAuth state
        const oauthState = getOAuthState();
        if (!oauthState) {
          throw new Error('OAuth state not found or expired');
        }

        // Get OAuth config from session storage (set by the initiating page)
        const configStr = sessionStorage.getItem(`oauth-config-${oauthState.serverId}`);
        if (!configStr) {
          throw new Error('OAuth configuration not found');
        }

        const config = JSON.parse(configStr) as OAuthConfig;

        // Exchange code for tokens
        setMessage('Exchanging authorization code for tokens...');
        const tokenResponse = await exchangeCodeForTokens(
          config,
          code,
          oauthState.codeVerifier
        );

        // Calculate expiry time
        const expiresAt = tokenResponse.expires_in
          ? Date.now() + tokenResponse.expires_in * 1000
          : undefined;

        // Save tokens
        saveOAuthToken({
          serverId: oauthState.serverId,
          serverName: oauthState.serverName,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenType: tokenResponse.token_type,
          expiresAt,
          scope: tokenResponse.scope,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Clear OAuth state
        clearOAuthState();
        sessionStorage.removeItem(`oauth-config-${oauthState.serverId}`);

        // Success
        setStatus('success');
        setMessage('Authorization successful! You can close this window.');

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-success',
              serverId: oauthState.serverId,
              serverName: oauthState.serverName,
            },
            window.location.origin
          );
        }

        // Auto-close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Authorization failed'
        );

        // Clear OAuth state on error
        clearOAuthState();

        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-error',
              error: error instanceof Error ? error.message : 'Authorization failed',
            },
            window.location.origin
          );
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Processing Authorization</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-green-500">Success!</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold text-destructive">
              Authorization Failed
            </h1>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

