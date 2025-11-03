/**
 * API Client Service Tests
 * Tests for all API request functions
 */

import {
  installationAPI,
  lifecycleAPI,
  registryAPI,
  apiClient,
} from './api-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('installationAPI', () => {
    describe('install', () => {
      it('should make POST request to install endpoint', async () => {
        const mockResponse = {
          installId: 'test-install-id',
          status: 'pending',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          source: 'npm' as const,
          packageName: '@test/package',
        };

        const result = await installationAPI.install(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/install', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed request', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid package name' }),
        });

        await expect(
          installationAPI.install({
            source: 'npm',
            packageName: 'invalid',
          })
        ).rejects.toThrow('Invalid package name');
      });

      it('should handle network errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Network error')
        );

        await expect(
          installationAPI.install({
            source: 'npm',
            packageName: '@test/package',
          })
        ).rejects.toThrow('Network error');
      });
    });

    describe('validate', () => {
      it('should make PUT request to validate endpoint', async () => {
        const mockResponse = {
          valid: true,
          errors: [],
          warnings: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          source: 'npm' as const,
          packageName: '@test/package',
        };

        const result = await installationAPI.validate(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/install', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getProgress', () => {
      it('should fetch installation progress', async () => {
        const mockResponse = {
          installId: 'test-id',
          status: 'downloading',
          progress: 50,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await installationAPI.getProgress('test-id');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/install/progress/test-id',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should encode special characters in installId', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await installationAPI.getProgress('test/id with spaces');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/install/progress/test%2Fid%20with%20spaces',
          expect.any(Object)
        );
      });
    });

    describe('cancel', () => {
      it('should make DELETE request to cancel installation', async () => {
        const mockResponse = {
          success: true,
          message: 'Installation cancelled',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await installationAPI.cancel('test-id');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/install/progress/test-id',
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('lifecycleAPI', () => {
    describe('start', () => {
      it('should start a server', async () => {
        const mockResponse = {
          serverId: 'test-server',
          status: 'running',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          serverId: 'test-server',
        };

        const result = await lifecycleAPI.start(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/lifecycle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('stop', () => {
      it('should stop a server', async () => {
        const mockResponse = {
          serverId: 'test-server',
          status: 'stopped',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          serverId: 'test-server',
        };

        const result = await lifecycleAPI.stop(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/lifecycle', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('restart', () => {
      it('should restart a server', async () => {
        const mockResponse = {
          serverId: 'test-server',
          status: 'running',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          serverId: 'test-server',
        };

        const result = await lifecycleAPI.restart(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/lifecycle', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getStatus', () => {
      it('should get server status', async () => {
        const mockResponse = {
          serverId: 'test-server',
          status: 'running',
          uptime: 12345,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await lifecycleAPI.getStatus('test-server');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/lifecycle/status/test-server',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('listRunning', () => {
      it('should list all running servers', async () => {
        const mockResponse = {
          servers: [
            { serverId: 'server-1', status: 'running' },
            { serverId: 'server-2', status: 'running' },
          ],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await lifecycleAPI.listRunning();

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/lifecycle', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('registryAPI', () => {
    describe('search', () => {
      it('should search registry', async () => {
        const mockResponse = {
          servers: [
            { id: 'server-1', name: 'Test Server 1' },
            { id: 'server-2', name: 'Test Server 2' },
          ],
          total: 2,
          hasMore: false,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          query: 'test',
          limit: 10,
        };

        const result = await registryAPI.search(request);

        expect(global.fetch).toHaveBeenCalledWith('/api/mcp/registry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getServer', () => {
      it('should get server by ID', async () => {
        const mockResponse = {
          id: 'test-server',
          name: 'Test Server',
          description: 'A test server',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await registryAPI.getServer('test-server');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry/test-server',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should encode special characters in serverId', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await registryAPI.getServer('@scope/package');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry/%40scope%2Fpackage',
          expect.any(Object)
        );
      });
    });

    describe('getCategories', () => {
      it('should get all categories', async () => {
        const mockResponse = {
          categories: ['database', 'api', 'tools'],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await registryAPI.getCategories();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry?action=categories',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getPopular', () => {
      it('should get popular servers with default params', async () => {
        const mockResponse = {
          servers: [{ id: 'popular-1' }, { id: 'popular-2' }],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await registryAPI.getPopular();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry?action=popular',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should get popular servers with limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ servers: [] }),
        });

        await registryAPI.getPopular(5);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry?action=popular&limit=5',
          expect.any(Object)
        );
      });

      it('should get popular servers with source filter', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ servers: [] }),
        });

        await registryAPI.getPopular(10, 'npm');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry?action=popular&limit=10&source=npm',
          expect.any(Object)
        );
      });
    });

    describe('refreshCache', () => {
      it('should refresh registry cache', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await registryAPI.refreshCache();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mcp/registry?action=refresh',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });
  });

  describe('apiClient', () => {
    it('should export combined API client', () => {
      expect(apiClient.installation).toBe(installationAPI);
      expect(apiClient.lifecycle).toBe(lifecycleAPI);
      expect(apiClient.registry).toBe(registryAPI);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors with JSON error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' }),
      });

      await expect(
        installationAPI.install({
          source: 'npm',
          packageName: '@test/package',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle HTTP errors without JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        installationAPI.install({
          source: 'npm',
          packageName: '@test/package',
        })
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should preserve custom headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // This would require modifying the apiRequest function to accept custom headers
      // For now, we're just testing the default behavior
      await installationAPI.install({
        source: 'npm',
        packageName: '@test/package',
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Content-Type', 'application/json');
    });
  });
});

