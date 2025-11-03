/**
 * Multi-IDE Configuration Parsers
 * Supports VS Code, Cursor, Cline/Roo-Cline, and Claude Desktop
 */

import type { MCPServerConfig } from '@/lib/types';
import { nanoid } from 'nanoid';

export type IDEType = 'vscode' | 'cursor' | 'cline' | 'roo-cline' | 'claude-desktop' | 'unknown';

export interface ParseResult {
  success: boolean;
  servers: MCPServerConfig[];
  errors: string[];
  warnings: string[];
  detectedFormat?: IDEType;
}

/**
 * VS Code MCP Configuration Format
 * Typically found in .vscode/settings.json or user settings
 */
export interface VSCodeMCPConfig {
  'mcp.servers'?: {
    [key: string]: {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
    };
  };
}

/**
 * Cursor IDE MCP Configuration Format
 * Similar to VS Code but may have cursor-specific fields
 */
export interface CursorMCPConfig {
  'cursor.mcp.servers'?: {
    [key: string]: {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
    };
  };
  // Fallback to standard MCP format
  'mcp.servers'?: {
    [key: string]: {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
    };
  };
}

/**
 * Cline/Roo-Cline Configuration Format
 * May use different key names
 */
export interface ClineMCPConfig {
  mcpServers?: {
    [key: string]: {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
    };
  };
}

/**
 * Claude Desktop Configuration Format (already supported)
 */
export interface ClaudeDesktopConfig {
  mcpServers: {
    [key: string]: {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
    };
  };
}

/**
 * Detect IDE configuration format
 */
export function detectIDEFormat(content: string): IDEType {
  try {
    const config = JSON.parse(content);

    // Check for VS Code format
    if (config['mcp.servers']) {
      return 'vscode';
    }

    // Check for Cursor format
    if (config['cursor.mcp.servers']) {
      return 'cursor';
    }

    // Check for Claude Desktop format
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      // Could be Claude Desktop or Cline
      // Check for Cline-specific indicators (if any)
      return 'claude-desktop';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Parse VS Code MCP configuration
 */
export function parseVSCodeConfig(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    servers: [],
    errors: [],
    warnings: [],
    detectedFormat: 'vscode',
  };

  try {
    const config: VSCodeMCPConfig = JSON.parse(content);

    if (!config['mcp.servers'] || typeof config['mcp.servers'] !== 'object') {
      result.errors.push('Invalid VS Code configuration: missing or invalid "mcp.servers" field');
      return result;
    }

    // Parse each server
    for (const [name, serverConfig] of Object.entries(config['mcp.servers'])) {
      try {
        const parsed = parseServerConfig(name, serverConfig);
        if (parsed) {
          result.servers.push(parsed);
        } else {
          result.warnings.push(`Skipped server "${name}": unable to determine transport type`);
        }
      } catch (error) {
        result.errors.push(
          `Failed to parse server "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.servers.length > 0;
    if (result.servers.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid servers found in configuration');
    }
  } catch (error) {
    result.errors.push(
      `Failed to parse VS Code configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    );
  }

  return result;
}

/**
 * Parse Cursor IDE MCP configuration
 */
export function parseCursorConfig(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    servers: [],
    errors: [],
    warnings: [],
    detectedFormat: 'cursor',
  };

  try {
    const config: CursorMCPConfig = JSON.parse(content);

    // Try cursor-specific format first
    const serversConfig = config['cursor.mcp.servers'] || config['mcp.servers'];

    if (!serversConfig || typeof serversConfig !== 'object') {
      result.errors.push('Invalid Cursor configuration: missing or invalid MCP servers field');
      return result;
    }

    // Parse each server
    for (const [name, serverConfig] of Object.entries(serversConfig)) {
      try {
        const parsed = parseServerConfig(name, serverConfig);
        if (parsed) {
          result.servers.push(parsed);
        } else {
          result.warnings.push(`Skipped server "${name}": unable to determine transport type`);
        }
      } catch (error) {
        result.errors.push(
          `Failed to parse server "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.servers.length > 0;
    if (result.servers.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid servers found in configuration');
    }
  } catch (error) {
    result.errors.push(
      `Failed to parse Cursor configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    );
  }

  return result;
}

/**
 * Parse Cline/Roo-Cline MCP configuration
 */
export function parseClineConfig(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    servers: [],
    errors: [],
    warnings: [],
    detectedFormat: 'cline',
  };

  try {
    const config: ClineMCPConfig = JSON.parse(content);

    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      result.errors.push('Invalid Cline configuration: missing or invalid "mcpServers" field');
      return result;
    }

    // Parse each server
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      try {
        const parsed = parseServerConfig(name, serverConfig);
        if (parsed) {
          result.servers.push(parsed);
        } else {
          result.warnings.push(`Skipped server "${name}": unable to determine transport type`);
        }
      } catch (error) {
        result.errors.push(
          `Failed to parse server "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.servers.length > 0;
    if (result.servers.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid servers found in configuration');
    }
  } catch (error) {
    result.errors.push(
      `Failed to parse Cline configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    );
  }

  return result;
}

/**
 * Parse individual server configuration (shared logic)
 */
function parseServerConfig(
  name: string,
  config: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    transport?: 'stdio' | 'sse' | 'http';
  }
): MCPServerConfig | null {
  const serverId = nanoid();
  const now = new Date().toISOString();

  // Determine transport type
  let transportType: 'stdio' | 'sse' | 'http';

  if (config.transport) {
    transportType = config.transport;
  } else if (config.command) {
    transportType = 'stdio';
  } else if (config.url) {
    const url = config.url.toLowerCase();
    if (url.includes('/sse') || url.includes('text/event-stream')) {
      transportType = 'sse';
    } else {
      transportType = 'http';
    }
  } else {
    return null;
  }

  // Build base config
  const baseConfig = {
    id: serverId,
    name,
    description: `Imported from IDE configuration`,
    transportType,
    createdAt: now,
    updatedAt: now,
  };

  // Build transport-specific config
  switch (transportType) {
    case 'stdio':
      if (!config.command) {
        throw new Error('stdio transport requires "command" field');
      }
      return {
        ...baseConfig,
        transportType: 'stdio' as const,
        command: config.command,
        args: config.args || [],
        env: config.env,
      };

    case 'sse':
      if (!config.url) {
        throw new Error('SSE transport requires "url" field');
      }
      return {
        ...baseConfig,
        transportType: 'sse' as const,
        url: config.url,
        headers: config.headers,
      };

    case 'http':
      if (!config.url) {
        throw new Error('HTTP transport requires "url" field');
      }
      return {
        ...baseConfig,
        transportType: 'http' as const,
        url: config.url,
        headers: config.headers,
      };

    default:
      throw new Error(`Unsupported transport type: ${transportType}`);
  }
}

