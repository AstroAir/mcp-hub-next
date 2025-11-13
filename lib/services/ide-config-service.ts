/**
 * IDE Config Service
 * 
 * Provides a unified interface for IDE config operations with Tauri/web mode detection.
 * Handles discovery, validation, import, and export of MCP server configurations from various IDEs.
 */

import { isTauri, invoke } from './tauri-bridge';
import { parseConfiguration, validateConfigFile } from '@/lib/utils/config-parser';
import type { ConfigDiscovery, ConfigValidation } from '@/lib/types/tauri';
import type { MCPServerConfig, MCPClientType } from '@/lib/types/mcp';

/**
 * Discover IDE config files on the system
 * Desktop mode: Uses Tauri command to scan default IDE config locations
 * Web mode: Returns empty array (no file system access)
 */
export async function discoverIDEConfigs(): Promise<ConfigDiscovery[]> {
  if (isTauri()) {
    try {
      return await invoke<ConfigDiscovery[]>('discover_ide_configs');
    } catch (error) {
      console.error('Failed to discover IDE configs:', error);
      throw error;
    }
  }
  // Web mode: no discovery available
  return [];
}

/**
 * Validate an IDE config file
 * Desktop mode: Uses Tauri command for validation
 * Web mode: Uses frontend validation logic
 */
export async function validateIDEConfig(
  path: string,
  clientType?: MCPClientType
): Promise<ConfigValidation> {
  if (isTauri()) {
    try {
      return await invoke<ConfigValidation>('validate_ide_config', {
        path,
        clientType,
      });
    } catch (error) {
      console.error('Failed to validate IDE config:', error);
      throw error;
    }
  }

  // Web mode: use frontend validation
  try {
    const response = await fetch(path);
    const content = await response.text();
    const result = validateConfigFile(content);
    
    return {
      valid: result.valid,
      clientType: result.clientType,
      errors: result.errors,
      warnings: result.warnings,
      serverCount: result.serverCount,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read config file: ${error}`],
      warnings: [],
    };
  }
}

/**
 * Import IDE config and convert to MCP Hub format
 * Desktop mode: Uses Tauri command for import
 * Web mode: Uses frontend parser
 */
export async function importIDEConfig(
  path: string,
  clientType: MCPClientType,
  mergeStrategy?: 'merge' | 'replace' | 'skip'
): Promise<MCPServerConfig[]> {
  if (isTauri()) {
    try {
      const json = await invoke<string>('import_ide_config', {
        path,
        clientType,
        mergeStrategy,
      });
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to import IDE config:', error);
      throw error;
    }
  }

  // Web mode: use frontend parser
  try {
    const response = await fetch(path);
    const content = await response.text();
    const result = parseConfiguration(content);
    
    if (!result.valid) {
      throw new Error(`Invalid config: ${result.errors.join(', ')}`);
    }
    
    return result.servers;
  } catch (error) {
    console.error('Failed to import IDE config:', error);
    throw error;
  }
}

/**
 * Export MCP Hub servers to IDE config format
 * Desktop mode: Uses Tauri command for export
 * Web mode: Uses frontend serialization
 */
export async function exportToIDEFormat(
  servers: MCPServerConfig[],
  clientType: MCPClientType,
  outputPath?: string
): Promise<string> {
  const serversJson = JSON.stringify(servers);

  if (isTauri()) {
    try {
      return await invoke<string>('export_to_ide_format', {
        serversJson,
        clientType,
        outputPath,
      });
    } catch (error) {
      console.error('Failed to export to IDE format:', error);
      throw error;
    }
  }

  // Web mode: return JSON string (no file write)
  const mcpServers: Record<string, Record<string, unknown>> = {};

  for (const server of servers) {
    const config: Record<string, unknown> = {};
    
    if (server.transportType === 'stdio') {
      config.command = server.command;
      config.args = server.args || [];
      config.env = server.env || {};
      if (server.cwd) config.cwd = server.cwd;
    } else {
      config.url = server.url;
      if (server.headers && Object.keys(server.headers).length > 0) {
        config.headers = server.headers;
      }
      config.transport = server.transportType;
    }
    
    mcpServers[server.name] = config;
  }

  return JSON.stringify({ mcpServers }, null, 2);
}

