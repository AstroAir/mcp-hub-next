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
  InstallationProgress,
  
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
import { isTauri, invoke as tauriInvoke } from '@/lib/services/tauri-bridge';

// Helper: convert snake_case keys from Rust to camelCase expected by TS types
function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelize(input: unknown): unknown {
  if (Array.isArray(input)) return (input as unknown[]).map((v) => camelize(v));
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[toCamelCaseKey(k)] = camelize(v);
    }
    return out;
  }
  return input;
}

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
    if (isTauri()) {
      // Tauri (Rust) expects snake_case arg names and returns a raw tuple [install_id, progress]
      const args: Record<string, unknown> = {
        config: request.config as unknown as Record<string, unknown>,
        _server_name: request.serverName,
        _server_description: request.serverDescription,
      };

      const raw = await tauriInvoke<unknown>('install_server', args);

      // Normalize return: Rust returns (String, InstallationProgress) → serialized as [id, progress]
  let installId: string | undefined;
  let progress: unknown;

      if (Array.isArray(raw) && raw.length === 2) {
        installId = String(raw[0]);
        progress = camelize(raw[1]) as unknown;
      } else if (raw && typeof raw === 'object') {
        // Fallback if Rust starts returning an object in future
        const obj = camelize(raw) as Record<string, unknown>;
        const possibleId = (obj.installId ?? (obj as Record<string, unknown>)['install_id'] ?? obj.id) as string | undefined;
        installId = possibleId;
        progress = obj.progress as unknown;
      }

      if (!installId || !progress) {
        throw new Error('Unexpected response from install_server');
      }

      return {
        success: true,
        data: { installId, progress: progress as unknown as InstallationProgress },
        message: 'Installation started successfully',
      };
    }
    return apiRequest<InstallServerResponse>('/api/mcp/install', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Validate installation configuration
   */
  async validate(request: ValidateInstallRequest): Promise<ValidateInstallResponse> {
    if (isTauri()) {
      const raw = await tauriInvoke<unknown>('validate_install', { config: request.config as unknown as Record<string, unknown> });
      const data = camelize(raw) as unknown as ValidateInstallResponse['data'];
      return { success: true, data } as ValidateInstallResponse;
    }
    return apiRequest<ValidateInstallResponse>('/api/mcp/install', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get installation progress
   */
  async getProgress(installId: string): Promise<GetInstallProgressResponse> {
    if (isTauri()) {
      const raw = await tauriInvoke<unknown>('get_install_progress', { install_id: installId });
      const data = camelize(raw) as unknown as GetInstallProgressResponse['data'];
      return { success: true, data } as GetInstallProgressResponse;
    }
    return apiRequest<GetInstallProgressResponse>(`/api/mcp/install/progress/${encodeURIComponent(installId)}`);
  },

  /**
   * Cancel installation
   */
  async cancel(installId: string): Promise<CancelInstallResponse> {
    if (isTauri()) {
      await tauriInvoke<unknown>('cancel_install', { install_id: installId });
      return { success: true, data: { installId } } as CancelInstallResponse;
    }
    return apiRequest<CancelInstallResponse>(`/api/mcp/install/progress/${encodeURIComponent(installId)}`, { method: 'DELETE' });
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
    if (isTauri()) {
      return tauriInvoke<StartServerResponse>('mcp_start_server', request as unknown as Record<string, unknown>);
    }
    return apiRequest<StartServerResponse>('/api/mcp/lifecycle', { method: 'POST', body: JSON.stringify(request) });
  },

  /**
   * Stop a server
   */
  async stop(request: StopServerRequest): Promise<StopServerResponse> {
    if (isTauri()) {
      return tauriInvoke<StopServerResponse>('mcp_stop_server', request as unknown as Record<string, unknown>);
    }
    return apiRequest<StopServerResponse>('/api/mcp/lifecycle', { method: 'DELETE', body: JSON.stringify(request) });
  },

  /**
   * Restart a server
   */
  async restart(request: RestartServerRequest): Promise<RestartServerResponse> {
    if (isTauri()) {
      return tauriInvoke<RestartServerResponse>('mcp_restart_server', request as unknown as Record<string, unknown>);
    }
    return apiRequest<RestartServerResponse>('/api/mcp/lifecycle', { method: 'PUT', body: JSON.stringify(request) });
  },

  /**
   * Get server status
   */
  async getStatus(serverId: string): Promise<GetServerStatusResponse> {
    if (isTauri()) {
      return tauriInvoke<GetServerStatusResponse>('mcp_get_status', { serverId });
    }
    return apiRequest<GetServerStatusResponse>(`/api/mcp/lifecycle/status/${encodeURIComponent(serverId)}`);
  },

  /**
   * List all running servers
   */
  async listRunning(): Promise<ListRunningServersResponse> {
    if (isTauri()) {
      return tauriInvoke<ListRunningServersResponse>('mcp_list_running');
    }
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
    if (isTauri()) {
      return tauriInvoke<SearchRegistryResponse>('registry_search', request as unknown as Record<string, unknown>);
    }
    return apiRequest<SearchRegistryResponse>('/api/mcp/registry', { method: 'POST', body: JSON.stringify(request) });
  },

  /**
   * Get server by ID
   */
  async getServer(serverId: string): Promise<GetRegistryServerResponse> {
    // For now, rely on API route for single server lookup (not critical path)
    return apiRequest<GetRegistryServerResponse>(`/api/mcp/registry/${encodeURIComponent(serverId)}`);
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ListRegistryCategoriesResponse> {
    if (isTauri()) {
      const categories = await tauriInvoke<string[]>('registry_categories');
      return { success: true, data: categories } as unknown as ListRegistryCategoriesResponse;
    }
    return apiRequest<ListRegistryCategoriesResponse>('/api/mcp/registry?action=categories');
  },

  /**
   * Get popular servers
   */
  async getPopular(
    limit?: number,
    source?: 'npm' | 'github'
  ): Promise<GetPopularServersResponse> {
    if (isTauri()) {
      return tauriInvoke<GetPopularServersResponse>('registry_popular', { limit, source });
    }
    const params = new URLSearchParams({ action: 'popular' });
    if (limit) params.set('limit', limit.toString());
    if (source) params.set('source', source);
    return apiRequest<GetPopularServersResponse>(`/api/mcp/registry?${params.toString()}`);
  },

  /**
   * Refresh registry cache
   */
  async refreshCache(): Promise<void> {
    if (isTauri()) {
      await tauriInvoke('registry_refresh');
      return;
    }
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

