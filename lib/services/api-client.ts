/**
 * API Client Service
 * Handles all API requests to the backend
 */

import type {
  // Installation API
  InstallServerRequest,
  InstallServerResponse,
  ValidateInstallRequest,
  ValidateInstallResponse,
  GetInstallProgressResponse,
  CancelInstallResponse,
  
  // Lifecycle API
  StartServerRequest,
  StartServerResponse,
  StopServerRequest,
  StopServerResponse,
  RestartServerRequest,
  RestartServerResponse,
  GetServerStatusResponse,
  ListRunningServersResponse,
  
  // Registry API
  SearchRegistryRequest,
  SearchRegistryResponse,
  GetRegistryServerResponse,
  ListRegistryCategoriesResponse,
  GetPopularServersResponse,
} from '@/lib/types';

/**
 * Base API request function
 */
async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

/**
 * Installation API Client
 */
export const installationAPI = {
  /**
   * Install a new MCP server
   */
  async install(request: InstallServerRequest): Promise<InstallServerResponse> {
    return apiRequest<InstallServerResponse>('/api/mcp/install', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Validate installation configuration
   */
  async validate(request: ValidateInstallRequest): Promise<ValidateInstallResponse> {
    return apiRequest<ValidateInstallResponse>('/api/mcp/install', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get installation progress
   */
  async getProgress(installId: string): Promise<GetInstallProgressResponse> {
    return apiRequest<GetInstallProgressResponse>(
      `/api/mcp/install/progress/${encodeURIComponent(installId)}`
    );
  },

  /**
   * Cancel installation
   */
  async cancel(installId: string): Promise<CancelInstallResponse> {
    return apiRequest<CancelInstallResponse>(
      `/api/mcp/install/progress/${encodeURIComponent(installId)}`,
      { method: 'DELETE' }
    );
  },
};

/**
 * Lifecycle API Client
 */
export const lifecycleAPI = {
  /**
   * Start a server
   */
  async start(request: StartServerRequest): Promise<StartServerResponse> {
    return apiRequest<StartServerResponse>('/api/mcp/lifecycle', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Stop a server
   */
  async stop(request: StopServerRequest): Promise<StopServerResponse> {
    return apiRequest<StopServerResponse>('/api/mcp/lifecycle', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  },

  /**
   * Restart a server
   */
  async restart(request: RestartServerRequest): Promise<RestartServerResponse> {
    return apiRequest<RestartServerResponse>('/api/mcp/lifecycle', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get server status
   */
  async getStatus(serverId: string): Promise<GetServerStatusResponse> {
    return apiRequest<GetServerStatusResponse>(
      `/api/mcp/lifecycle/status/${encodeURIComponent(serverId)}`
    );
  },

  /**
   * List all running servers
   */
  async listRunning(): Promise<ListRunningServersResponse> {
    return apiRequest<ListRunningServersResponse>('/api/mcp/lifecycle');
  },
};

/**
 * Registry API Client
 */
export const registryAPI = {
  /**
   * Search registry
   */
  async search(request: SearchRegistryRequest): Promise<SearchRegistryResponse> {
    return apiRequest<SearchRegistryResponse>('/api/mcp/registry', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get server by ID
   */
  async getServer(serverId: string): Promise<GetRegistryServerResponse> {
    return apiRequest<GetRegistryServerResponse>(
      `/api/mcp/registry/${encodeURIComponent(serverId)}`
    );
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ListRegistryCategoriesResponse> {
    return apiRequest<ListRegistryCategoriesResponse>(
      '/api/mcp/registry?action=categories'
    );
  },

  /**
   * Get popular servers
   */
  async getPopular(
    limit?: number,
    source?: 'npm' | 'github'
  ): Promise<GetPopularServersResponse> {
    const params = new URLSearchParams({ action: 'popular' });
    if (limit) params.set('limit', limit.toString());
    if (source) params.set('source', source);

    return apiRequest<GetPopularServersResponse>(
      `/api/mcp/registry?${params.toString()}`
    );
  },

  /**
   * Refresh registry cache
   */
  async refreshCache(): Promise<void> {
    await apiRequest('/api/mcp/registry?action=refresh');
  },
};

/**
 * Combined API client
 */
export const apiClient = {
  installation: installationAPI,
  lifecycle: lifecycleAPI,
  registry: registryAPI,
};

