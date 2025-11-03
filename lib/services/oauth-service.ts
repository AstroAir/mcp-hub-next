/**
 * OAuth 2.1 Service
 * Handles OAuth authentication with PKCE support
 */

import type {
  OAuthConfig,
  OAuthTokenResponse,
  StoredOAuthToken,
  PKCEChallenge,
  OAuthState,
  OAuthError,
} from '@/lib/types/oauth';

const OAUTH_STATE_KEY = 'mcp-oauth-state';
const OAUTH_TOKENS_KEY = 'mcp-oauth-tokens';

/**
 * Generate a random string for code verifier
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Generate SHA-256 hash
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE challenge
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const codeVerifier = generateRandomString(128);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Build authorization URL
 */
export function buildAuthorizationUrl(
  config: OAuthConfig,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  if (config.scope) {
    params.append('scope', config.scope);
  }

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: OAuthConfig,
  code: string,
  codeVerifier: string
): Promise<OAuthTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  if (config.clientSecret) {
    params.append('client_secret', config.clientSecret);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as OAuthError;
    throw new Error(error.error_description || error.error || 'Token exchange failed');
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  config: OAuthConfig,
  refreshToken: string
): Promise<OAuthTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    params.append('client_secret', config.clientSecret);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as OAuthError;
    throw new Error(error.error_description || error.error || 'Token refresh failed');
  }

  return response.json();
}

/**
 * Save OAuth state for authorization flow
 */
export function saveOAuthState(state: OAuthState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save OAuth state:', error);
  }
}

/**
 * Get OAuth state
 */
export function getOAuthState(): OAuthState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(OAUTH_STATE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as OAuthState;
    
    // Check if state is expired (5 minutes)
    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(OAUTH_STATE_KEY);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to get OAuth state:', error);
    return null;
  }
}

/**
 * Clear OAuth state
 */
export function clearOAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OAUTH_STATE_KEY);
}

/**
 * Save OAuth tokens
 */
export function saveOAuthToken(token: StoredOAuthToken): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(OAUTH_TOKENS_KEY);
    const tokens = stored ? JSON.parse(stored) : {};
    
    tokens[token.serverId] = token;
    
    localStorage.setItem(OAUTH_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to save OAuth token:', error);
  }
}

/**
 * Get OAuth token for a server
 */
export function getOAuthToken(serverId: string): StoredOAuthToken | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(OAUTH_TOKENS_KEY);
    if (!stored) return null;
    
    const tokens = JSON.parse(stored);
    return tokens[serverId] || null;
  } catch (error) {
    console.error('Failed to get OAuth token:', error);
    return null;
  }
}

/**
 * Get all OAuth tokens
 */
export function getAllOAuthTokens(): Record<string, StoredOAuthToken> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(OAUTH_TOKENS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get OAuth tokens:', error);
    return {};
  }
}

/**
 * Delete OAuth token
 */
export function deleteOAuthToken(serverId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(OAUTH_TOKENS_KEY);
    if (!stored) return;
    
    const tokens = JSON.parse(stored);
    delete tokens[serverId];
    
    localStorage.setItem(OAUTH_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to delete OAuth token:', error);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: StoredOAuthToken): boolean {
  if (!token.expiresAt) return false;
  
  // Consider token expired 5 minutes before actual expiry
  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= token.expiresAt - bufferTime;
}

/**
 * Start OAuth flow
 */
export async function startOAuthFlow(
  serverId: string,
  serverName: string,
  config: OAuthConfig
): Promise<void> {
  // Generate PKCE challenge
  const pkce = await generatePKCEChallenge();
  
  // Generate state
  const state = generateRandomString(32);
  
  // Save state
  saveOAuthState({
    serverId,
    serverName,
    codeVerifier: pkce.codeVerifier,
    redirectUri: config.redirectUri,
    timestamp: Date.now(),
  });
  
  // Build authorization URL
  const authUrl = buildAuthorizationUrl(config, pkce.codeChallenge, state);
  
  // Open authorization URL in popup
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  window.open(
    authUrl,
    'oauth-popup',
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

