'use client';

/**
 * OAuth Authentication Dialog
 * Handles OAuth authentication flow for remote MCP servers
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { getOAuthToken, isTokenExpired, refreshAccessToken, startOAuthFlow } from '@/lib/services/oauth-service';
import type { OAuthConfig, StoredOAuthToken } from '@/lib/types/oauth';
import { toast } from 'sonner';

interface OAuthAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
  oauthConfig: OAuthConfig;
  onSuccess?: (token: StoredOAuthToken) => void;
}

export function OAuthAuthDialog({
  open,
  onOpenChange,
  serverId,
  serverName,
  oauthConfig,
  onSuccess,
}: OAuthAuthDialogProps) {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<StoredOAuthToken | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    if (open) {
      const existingToken = getOAuthToken(serverId);
      if (existingToken) {
        setToken(existingToken);
        if (isTokenExpired(existingToken)) {
          setStatus('error');
          setError('Token has expired. Please re-authenticate.');
        } else {
          setStatus('success');
        }
      } else {
        setStatus('idle');
        setError(null);
      }
    }
  }, [open, serverId]);

  // Listen for OAuth success/error messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-success' && event.data.serverId === serverId) {
        const newToken = getOAuthToken(serverId);
        if (newToken) {
          setToken(newToken);
          setStatus('success');
          setError(null);
          toast.success(`Successfully authenticated with ${serverName}`);
          onSuccess?.(newToken);
        }
      } else if (event.data.type === 'oauth-error' && event.data.serverId === serverId) {
        setStatus('error');
        setError(event.data.error || 'Authentication failed');
        toast.error(`Authentication failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [serverId, serverName, onSuccess]);

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError(null);

      // Save OAuth config to session storage for callback
      sessionStorage.setItem(`oauth-config-${serverId}`, JSON.stringify(oauthConfig));

      // Start OAuth flow
      await startOAuthFlow(serverId, serverName, oauthConfig);

      toast.info('Please complete authentication in the popup window');
    } catch (err) {
      console.error('OAuth authentication error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
      toast.error('Failed to start authentication');
    }
  };

  const handleRefreshToken = async () => {
    if (!token?.refreshToken) {
      toast.error('No refresh token available. Please re-authenticate.');
      return;
    }

    try {
      setIsRefreshing(true);
      const newTokenResponse = await refreshAccessToken(oauthConfig, token.refreshToken);

      // Update stored token
      const updatedToken: StoredOAuthToken = {
        ...token,
        accessToken: newTokenResponse.access_token,
        refreshToken: newTokenResponse.refresh_token || token.refreshToken,
        expiresAt: newTokenResponse.expires_in
          ? Date.now() + newTokenResponse.expires_in * 1000
          : token.expiresAt,
        updatedAt: Date.now(),
      };

      // Save to localStorage
      const tokens = JSON.parse(localStorage.getItem('oauth-tokens') || '{}');
      tokens[serverId] = updatedToken;
      localStorage.setItem('oauth-tokens', JSON.stringify(tokens));

      setToken(updatedToken);
      setStatus('success');
      setError(null);
      toast.success('Token refreshed successfully');
      onSuccess?.(updatedToken);
    } catch (err) {
      console.error('Token refresh error:', err);
      toast.error('Failed to refresh token. Please re-authenticate.');
      setStatus('error');
      setError('Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'authenticating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'authenticating':
        return 'Waiting for authentication...';
      case 'success':
        return 'Successfully authenticated';
      case 'error':
        return error || 'Authentication failed';
      default:
        return 'Ready to authenticate';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            OAuth Authentication
          </DialogTitle>
          <DialogDescription>
            Authenticate with {serverName} using OAuth 2.1 with PKCE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{getStatusMessage()}</p>
              {token && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isTokenExpired(token) ? (
                    <span className="text-red-500">Token expired</span>
                  ) : (
                    <>
                      Expires:{' '}
                      {token.expiresAt
                        ? new Date(token.expiresAt).toLocaleString()
                        : 'Never'}
                    </>
                  )}
                </p>
              )}
            </div>
            {status === 'success' && <Badge variant="default">Active</Badge>}
          </div>

          {/* OAuth Config Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client ID:</span>
              <span className="font-mono text-xs">{oauthConfig.clientId.slice(0, 20)}...</span>
            </div>
            {oauthConfig.scope && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scope:</span>
                <span className="text-xs">{oauthConfig.scope}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">PKCE:</span>
              <Badge variant="outline" className="text-xs">
                {oauthConfig.usePKCE ? 'Enabled (S256)' : 'Disabled'}
              </Badge>
            </div>
          </div>

          {/* Error Alert */}
          {status === 'error' && error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {status === 'success' && !isTokenExpired(token!) && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                You are successfully authenticated with {serverName}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {status === 'success' && token?.refreshToken && (
            <Button
              variant="outline"
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Token
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleAuthenticate}
            disabled={status === 'authenticating'}
            className="w-full sm:w-auto"
          >
            {status === 'authenticating' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : status === 'success' ? (
              'Re-authenticate'
            ) : (
              'Authenticate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

