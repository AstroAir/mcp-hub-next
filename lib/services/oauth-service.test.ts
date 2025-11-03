/**
 * OAuth Service Tests
 * Tests for OAuth 2.1 with PKCE flow
 */

import {
  generatePKCEChallenge,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  saveOAuthState,
  getOAuthState,
  clearOAuthState,
  saveOAuthToken,
  getOAuthToken,
  getAllOAuthTokens,
  deleteOAuthToken,
  isTokenExpired,
  startOAuthFlow,
} from './oauth-service';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.subtle for PKCE
const mockDigest = jest.fn().mockImplementation(async (algorithm: string, data: BufferSource) => {
  // Create a simple hash based on the input data
  const bytes = new Uint8Array(data as ArrayBuffer);
  const hash = new Uint8Array(32);
  for (let i = 0; i < bytes.length && i < 32; i++) {
    hash[i] = bytes[i];
  }
  // Fill remaining with pseudo-random values based on input
  for (let i = bytes.length; i < 32; i++) {
    hash[i] = (bytes[i % bytes.length] || 0) + i;
  }
  return hash.buffer;
});

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
    getRandomValues: jest.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

describe('OAuth Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('PKCE Challenge Generation', () => {
    describe('generatePKCEChallenge', () => {
      it('should generate code verifier and challenge', async () => {
        const result = await generatePKCEChallenge();

        expect(result).toHaveProperty('codeVerifier');
        expect(result).toHaveProperty('codeChallenge');
        expect(result.codeVerifier).toHaveLength(128);
        expect(result.codeChallenge).toBeTruthy();
        expect(mockDigest).toHaveBeenCalled();
      });

      it('should generate different values on each call', async () => {
        const result1 = await generatePKCEChallenge();
        const result2 = await generatePKCEChallenge();

        expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
        expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
      });

      it('should use SHA-256 for challenge', async () => {
        await generatePKCEChallenge();

        expect(mockDigest).toHaveBeenCalled();
        const callArgs = mockDigest.mock.calls[0];
        expect(callArgs[0]).toBe('SHA-256');
        // Check that the second argument is a Uint8Array-like object
        expect(callArgs[1]).toHaveProperty('byteLength');
        expect(callArgs[1]).toHaveProperty('buffer');
      });
    });
  });

  describe('Authorization URL Building', () => {
    describe('buildAuthorizationUrl', () => {
      it('should build authorization URL with required params', async () => {
        const config = {
          authorizationEndpoint: 'https://auth.example.com/authorize',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          scope: 'read write',
        };

        const result = await buildAuthorizationUrl(config);

        expect(result.url).toContain('https://auth.example.com/authorize');
        expect(result.url).toContain('client_id=test-client-id');
        expect(result.url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
        expect(result.url).toContain('scope=read%20write');
        expect(result.url).toContain('response_type=code');
        expect(result.url).toContain('code_challenge_method=S256');
        expect(result.url).toContain('code_challenge=');
        expect(result.url).toContain('state=');
      });

      it('should return state and code verifier', async () => {
        const config = {
          authorizationEndpoint: 'https://auth.example.com/authorize',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          scope: 'read',
        };

        const result = await buildAuthorizationUrl(config);

        expect(result.state).toBeTruthy();
        expect(result.codeVerifier).toHaveLength(128);
      });

      it('should include optional parameters', async () => {
        const config = {
          authorizationEndpoint: 'https://auth.example.com/authorize',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          scope: 'read',
          additionalParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        };

        const result = await buildAuthorizationUrl(config);

        expect(result.url).toContain('prompt=consent');
        expect(result.url).toContain('access_type=offline');
      });
    });
  });

  describe('Token Exchange', () => {
    describe('exchangeCodeForTokens', () => {
      it('should exchange authorization code for tokens', async () => {
        const mockTokenResponse = {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-456',
          expires_in: 3600,
          token_type: 'Bearer',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        });

        const config = {
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          code: 'auth-code-123',
          codeVerifier: 'verifier-123',
        };

        const result = await exchangeCodeForTokens(config);

        expect(result).toEqual(mockTokenResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://auth.example.com/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
        );
      });

      it('should include client secret if provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'token' }),
        });

        const config = {
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          clientSecret: 'secret-123',
          redirectUri: 'http://localhost:3000/callback',
          code: 'auth-code-123',
          codeVerifier: 'verifier-123',
        };

        await exchangeCodeForTokens(config);

        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        const body = callArgs[1].body;
        expect(body).toContain('client_secret=secret-123');
      });

      it('should throw error on failed token exchange', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_grant' }),
        });

        const config = {
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          code: 'invalid-code',
          codeVerifier: 'verifier-123',
        };

        await expect(exchangeCodeForTokens(config)).rejects.toThrow();
      });
    });

    describe('refreshAccessToken', () => {
      it('should refresh access token', async () => {
        const mockTokenResponse = {
          access_token: 'new-access-token',
          expires_in: 3600,
          token_type: 'Bearer',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        });

        const config = {
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          usePKCE: true,
        };

        const result = await refreshAccessToken(config, 'refresh-token-456');

        expect(result).toEqual(mockTokenResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://auth.example.com/token',
          expect.objectContaining({
            method: 'POST',
          })
        );

        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        const body = callArgs[1].body;
        expect(body).toContain('grant_type=refresh_token');
        expect(body).toContain('refresh_token=refresh-token-456');
      });

      it('should handle refresh token errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_grant' }),
        });

        const config = {
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          refreshToken: 'invalid-refresh-token',
        };

        await expect(refreshAccessToken(config)).rejects.toThrow();
      });
    });
  });

  describe('OAuth State Management', () => {
    describe('saveOAuthState and getOAuthState', () => {
      it('should save and retrieve OAuth state', () => {
        const state = {
          state: 'state-123',
          codeVerifier: 'verifier-123',
          serverId: 'server1',
          redirectUri: 'http://localhost:3000/callback',
        };

        saveOAuthState(state);
        const retrieved = getOAuthState('state-123');

        expect(retrieved).toEqual(state);
      });

      it('should return null for non-existent state', () => {
        const retrieved = getOAuthState('non-existent-state');
        expect(retrieved).toBeNull();
      });
    });

    describe('clearOAuthState', () => {
      it('should clear OAuth state', () => {
        const state = {
          state: 'state-123',
          codeVerifier: 'verifier-123',
          serverId: 'server1',
          redirectUri: 'http://localhost:3000/callback',
        };

        saveOAuthState(state);
        clearOAuthState('state-123');

        const retrieved = getOAuthState('state-123');
        expect(retrieved).toBeNull();
      });
    });
  });

  describe('Token Storage', () => {
    describe('saveOAuthToken and getOAuthToken', () => {
      it('should save and retrieve OAuth token', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          expiresAt: Date.now() + 3600000,
          tokenType: 'Bearer',
          scope: 'read write',
        };

        saveOAuthToken(token);
        const retrieved = getOAuthToken('server1');

        expect(retrieved).toEqual(token);
      });

      it('should return null for non-existent token', () => {
        const retrieved = getOAuthToken('non-existent-server');
        expect(retrieved).toBeNull();
      });

      it('should update existing token', () => {
        const token1 = {
          serverId: 'server1',
          accessToken: 'old-token',
          expiresAt: Date.now() + 3600000,
        };

        const token2 = {
          serverId: 'server1',
          accessToken: 'new-token',
          expiresAt: Date.now() + 7200000,
        };

        saveOAuthToken(token1);
        saveOAuthToken(token2);

        const retrieved = getOAuthToken('server1');
        expect(retrieved?.accessToken).toBe('new-token');
      });
    });

    describe('getAllOAuthTokens', () => {
      it('should return all stored tokens', () => {
        const token1 = {
          serverId: 'server1',
          accessToken: 'token1',
          expiresAt: Date.now() + 3600000,
        };

        const token2 = {
          serverId: 'server2',
          accessToken: 'token2',
          expiresAt: Date.now() + 3600000,
        };

        saveOAuthToken(token1);
        saveOAuthToken(token2);

        const allTokens = getAllOAuthTokens();
        expect(allTokens).toHaveLength(2);
        expect(allTokens.map((t) => t.serverId)).toContain('server1');
        expect(allTokens.map((t) => t.serverId)).toContain('server2');
      });

      it('should return empty array when no tokens exist', () => {
        const allTokens = getAllOAuthTokens();
        expect(allTokens).toEqual([]);
      });
    });

    describe('deleteOAuthToken', () => {
      it('should delete OAuth token', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
          expiresAt: Date.now() + 3600000,
        };

        saveOAuthToken(token);
        const deleted = deleteOAuthToken('server1');

        expect(deleted).toBe(true);
        expect(getOAuthToken('server1')).toBeNull();
      });

      it('should return false for non-existent token', () => {
        const deleted = deleteOAuthToken('non-existent-server');
        expect(deleted).toBe(false);
      });
    });

    describe('isTokenExpired', () => {
      it('should return false for valid token', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
          expiresAt: Date.now() + 3600000, // 1 hour from now
        };

        expect(isTokenExpired(token)).toBe(false);
      });

      it('should return true for expired token', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
          expiresAt: Date.now() - 1000, // 1 second ago
        };

        expect(isTokenExpired(token)).toBe(true);
      });

      it('should return true for token expiring soon (within buffer)', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
          expiresAt: Date.now() + 30000, // 30 seconds from now
        };

        // Default buffer is 60 seconds
        expect(isTokenExpired(token)).toBe(true);
      });

      it('should respect custom buffer time', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
          expiresAt: Date.now() + 45000, // 45 seconds from now
        };

        // With 30 second buffer, should not be expired
        expect(isTokenExpired(token, 30000)).toBe(false);

        // With 60 second buffer, should be expired
        expect(isTokenExpired(token, 60000)).toBe(true);
      });

      it('should return true for token without expiresAt', () => {
        const token = {
          serverId: 'server1',
          accessToken: 'token',
        };

        expect(isTokenExpired(token)).toBe(true);
      });
    });
  });

  describe('OAuth Flow Integration', () => {
    describe('startOAuthFlow', () => {
      it('should start OAuth flow and return authorization URL', async () => {
        const config = {
          serverId: 'server1',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          scope: 'read write',
        };

        const result = await startOAuthFlow(config);

        expect(result.url).toContain('https://auth.example.com/authorize');
        expect(result.state).toBeTruthy();

        // State should be saved
        const savedState = getOAuthState(result.state);
        expect(savedState).toBeTruthy();
        expect(savedState?.serverId).toBe('server1');
      });

      it('should save state with all required information', async () => {
        const config = {
          serverId: 'server1',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          scope: 'read',
        };

        const result = await startOAuthFlow(config);
        const savedState = getOAuthState(result.state);

        expect(savedState).toMatchObject({
          state: result.state,
          serverId: 'server1',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier: expect.any(String),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('mcp-oauth-tokens', 'invalid json');

      expect(() => getAllOAuthTokens()).not.toThrow();
      expect(getAllOAuthTokens()).toEqual([]);
    });

    it('should handle network errors in token exchange', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const config = {
        tokenEndpoint: 'https://auth.example.com/token',
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        code: 'auth-code',
        codeVerifier: 'verifier',
      };

      await expect(exchangeCodeForTokens(config)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('SSR Safety', () => {
    it('should handle server-side rendering gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => getAllOAuthTokens()).not.toThrow();
      expect(() => getOAuthToken('server1')).not.toThrow();

      global.window = originalWindow;
    });
  });
});

