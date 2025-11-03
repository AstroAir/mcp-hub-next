/**
 * OAuth 2.1 Types
 * Types for OAuth authentication with PKCE support
 */

/**
 * OAuth 2.1 configuration for a remote MCP server
 */
export interface OAuthConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string; // Optional for public clients
  scope?: string;
  redirectUri: string;
  usePKCE: boolean; // Always true for OAuth 2.1
  additionalParams?: Record<string, string>; // Additional query parameters
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Stored OAuth tokens with metadata
 */
export interface StoredOAuthToken {
  serverId: string;
  serverName: string;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: number; // Unix timestamp
  scope?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * PKCE challenge data
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * OAuth state for tracking authorization flow
 */
export interface OAuthState {
  state: string;
  serverId: string;
  serverName: string;
  codeVerifier: string;
  redirectUri: string;
  timestamp: number;
}

/**
 * OAuth error response
 */
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

