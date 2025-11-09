'use client';

/**
 * OAuth Authentication Dialog
 * Handles OAuth authentication flow for remote MCP servers
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
import { getOAuthToken, isTokenExpired, refreshAccessToken, startOAuthFlow, openOAuthPopup } from '@/lib/services/oauth-service';
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
  const t = useTranslations('components.oauthAuth');
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
          const message = t('errors.tokenExpired');
          setError(message);
        } else {
          setStatus('success');
        }
      } else {
        setStatus('idle');
        setError(null);
      }
    }
  }, [open, serverId, t]);

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
          toast.success(t('toasts.success', { name: serverName }));
          onSuccess?.(newToken);
        }
      } else if (event.data.type === 'oauth-error' && event.data.serverId === serverId) {
        setStatus('error');
        const reason = event.data.error;
        setError(reason || t('errors.authFailed'));
        toast.error(
          reason
            ? t('toasts.error', { reason })
            : t('errors.authFailed')
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [serverId, serverName, onSuccess, t]);

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError(null);

      // Save OAuth config to session storage for callback
      sessionStorage.setItem(`oauth-config-${serverId}`, JSON.stringify(oauthConfig));

      // Start OAuth flow
      const { url } = await startOAuthFlow({ ...oauthConfig, serverId, serverName });
      openOAuthPopup(url);
      toast.info(t('toasts.popup'));
    } catch (err) {
      console.error('OAuth authentication error:', err);
      setStatus('error');
      const message = err instanceof Error ? err.message : t('errors.startFailed');
      setError(message);
      toast.error(t('toasts.startFailed'));
    }
  };

  const handleRefreshToken = async () => {
    if (!token?.refreshToken) {
      toast.error(t('errors.refreshMissing'));
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
      toast.success(t('toasts.refreshSuccess'));
      onSuccess?.(updatedToken);
    } catch (err) {
      console.error('Token refresh error:', err);
      toast.error(t('toasts.refreshFailed'));
      setStatus('error');
      setError(t('errors.refreshFailed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'authenticating':
        return <Loader2 aria-hidden className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 aria-hidden className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle aria-hidden className="h-5 w-5 text-red-500" />;
      default:
        return <Lock aria-hidden className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'authenticating':
        return t('status.authenticating');
      case 'success':
        return t('status.success');
      case 'error':
        return error || t('errors.authFailed');
      default:
        return t('status.idle');
    }
  };

  const tokenExpiryLabel = useMemo(() => {
    if (!token) return null;
    if (isTokenExpired(token)) {
      return <span className="text-red-500">{t('token.expired')}</span>;
    }

    return (
      <>
        {t('token.expires', {
          value: token.expiresAt ? new Date(token.expiresAt).toLocaleString() : t('token.never'),
        })}
      </>
    );
  }, [t, token]);

  const isTokenActive = status === 'success' && token && !isTokenExpired(token);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock aria-hidden className="h-5 w-5" />
            {t('dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialog.description', { name: serverName })}
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
                  {tokenExpiryLabel}
                </p>
              )}
            </div>
            {isTokenActive && <Badge variant="default">{t('badges.active')}</Badge>}
          </div>

          {/* OAuth Config Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('info.clientId')}</span>
              <span className="font-mono text-xs">{oauthConfig.clientId.slice(0, 20)}...</span>
            </div>
            {oauthConfig.scope && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('info.scope')}</span>
                <span className="text-xs">{oauthConfig.scope}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('info.pkce')}</span>
              <Badge variant="outline" className="text-xs">
                {oauthConfig.usePKCE ? t('info.pkceEnabled') : t('info.pkceDisabled')}
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
          {isTokenActive && (
            <Alert>
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              <AlertDescription>
                {t('alerts.success', { name: serverName })}
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
                  <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
                  {t('buttons.refreshing')}
                </>
              ) : (
                <>
                  <RefreshCw aria-hidden className="h-4 w-4 mr-2" />
                  {t('buttons.refresh')}
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
                <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
                {t('buttons.authenticating')}
              </>
            ) : status === 'success' ? (
              t('buttons.reauthenticate')
            ) : (
              t('buttons.authenticate')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

