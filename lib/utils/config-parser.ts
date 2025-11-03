/**
 * Multi-IDE Configuration Parser
 * Parses and validates MCP configuration files from various IDEs
 * Supports: Claude Desktop, VS Code, Cursor, Cline/Roo-Cline
 */

import type { MCPServerConfig } from '@/lib/types';
import { nanoid } from 'nanoid';
import {
  detectIDEFormat,
  parseVSCodeConfig,
  parseCursorConfig,
  parseClineConfig,
  type IDEType,
} from './ide-config-parsers';

/**
 * Claude Desktop configuration format
 */
export interface ClaudeDesktopConfig {
  mcpServers: {
    [key: string]: ClaudeDesktopServerConfig;
  };
}

export interface ClaudeDesktopServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  transport?: 'stdio' | 'sse' | 'http';
}

export interface ParseResult {
  success: boolean;
  servers: MCPServerConfig[];
  errors: string[];
  warnings: string[];
  detectedFormat?: IDEType;
  sourceFile?: string; // Optional source file name/path
}

/**
 * Extended server config with source file information
 */
export type ServerWithSource = MCPServerConfig & {
  sourceFile?: string;
};

/**
 * Aggregated parse result from multiple files
 */
export interface AggregatedParseResult {
  success: boolean;
  servers: ServerWithSource[];
  errors: Array<{ file: string; error: string }>;
  warnings: Array<{ file: string; warning: string }>;
  fileResults: Array<{ file: string; result: ParseResult }>;
  totalFiles: number;
  successfulFiles: number;
}

/**
 * Unified configuration parser - auto-detects format and parses accordingly
 */
export function parseConfiguration(content: string): ParseResult {
  // Detect format
  const format = detectIDEFormat(content);

  // Route to appropriate parser
  switch (format) {
    case 'vscode':
      return parseVSCodeConfig(content);

    case 'cursor':
      return parseCursorConfig(content);

    case 'cline':
    case 'roo-cline':
      return parseClineConfig(content);

    case 'claude-desktop':
      return parseClaudeDesktopConfig(content);

    default: {
      // Try all parsers and return the first successful one
      const parsers = [
        { name: 'Claude Desktop', fn: parseClaudeDesktopConfig },
        { name: 'VS Code', fn: parseVSCodeConfig },
        { name: 'Cursor', fn: parseCursorConfig },
        { name: 'Cline', fn: parseClineConfig },
      ];

      for (const parser of parsers) {
        try {
          const result = parser.fn(content);
          if (result.success) {
            return result;
          }
        } catch {
          // Continue to next parser
        }
      }

      // All parsers failed
      return {
        success: false,
        servers: [],
        errors: ['Unable to detect configuration format. Please ensure the file is valid JSON and follows a supported format.'],
        warnings: [],
        detectedFormat: 'unknown',
      };
    }
  }
}

/**
 * Parse Claude Desktop configuration file
 */
export function parseClaudeDesktopConfig(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    servers: [],
    errors: [],
    warnings: [],
  };

  try {
    // Parse JSON
    const config: ClaudeDesktopConfig = JSON.parse(content);

    // Validate structure
    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      result.errors.push('Invalid configuration: missing or invalid "mcpServers" field');
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
      `Failed to parse configuration file: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    );
  }

  return result;
}

/**
 * Parse individual server configuration
 */
function parseServerConfig(
  name: string,
  config: ClaudeDesktopServerConfig
): MCPServerConfig | null {
  const serverId = nanoid();
  const now = new Date().toISOString();

  // Determine transport type
  let transportType: 'stdio' | 'sse' | 'http';

  if (config.transport) {
    // Explicit transport type
    transportType = config.transport;
  } else if (config.command) {
    // Has command -> stdio
    transportType = 'stdio';
  } else if (config.url) {
    // Has URL -> determine from URL or default to http
    const url = config.url.toLowerCase();
    if (url.includes('/sse') || url.includes('text/event-stream')) {
      transportType = 'sse';
    } else {
      transportType = 'http';
    }
  } else {
    // Cannot determine transport type
    return null;
  }

  // Build base config
  const baseConfig = {
    id: serverId,
    name,
    description: `Imported from Claude Desktop configuration`,
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

/**
 * Validate configuration file content
 */
export function validateConfigFile(content: string): { valid: boolean; error?: string } {
  try {
    const config = JSON.parse(content);

    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      return {
        valid: false,
        error: 'Invalid configuration: missing or invalid "mcpServers" field',
      };
    }

    if (Object.keys(config.mcpServers).length === 0) {
      return {
        valid: false,
        error: 'Configuration contains no servers',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Export servers to Claude Desktop configuration format
 */
export function exportToClaudeDesktopConfig(servers: MCPServerConfig[]): string {
  const config: ClaudeDesktopConfig = {
    mcpServers: {},
  };

  for (const server of servers) {
    const serverConfig: ClaudeDesktopServerConfig = {
      transport: server.transportType,
    };

    switch (server.transportType) {
      case 'stdio':
        serverConfig.command = server.command;
        serverConfig.args = server.args;
        if (server.env) {
          serverConfig.env = server.env;
        }
        break;

      case 'sse':
      case 'http':
        serverConfig.url = server.url;
        if (server.headers) {
          serverConfig.headers = server.headers;
        }
        break;
    }

    config.mcpServers[server.name] = serverConfig;
  }

  return JSON.stringify(config, null, 2);
}

/**
 * Merge imported servers with existing servers
 * Handles duplicates by renaming
 * Accepts both MCPServerConfig[] and ServerWithSource[]
 */
export function mergeServers(
  existingServers: MCPServerConfig[],
  newServers: MCPServerConfig[] | ServerWithSource[]
): MCPServerConfig[] {
  const existingNames = new Set(existingServers.map((s) => s.name.toLowerCase()));
  const merged = [...existingServers];

  for (const server of newServers) {
    let name = server.name;
    let counter = 1;

    // Handle duplicate names
    while (existingNames.has(name.toLowerCase())) {
      name = `${server.name} (${counter})`;
      counter++;
    }

    // Remove sourceFile property if present (it's only for display purposes)
    const { sourceFile, ...serverConfig } = server as ServerWithSource;

    merged.push({
      ...serverConfig,
      name,
    });

    existingNames.add(name.toLowerCase());
  }

  return merged;
}

/**
 * Parse multiple configuration files and aggregate results
 */
export async function parseMultipleFiles(files: File[]): Promise<AggregatedParseResult> {
  const fileResults: Array<{ file: string; result: ParseResult }> = [];
  const allServers: ServerWithSource[] = [];
  const allErrors: Array<{ file: string; error: string }> = [];
  const allWarnings: Array<{ file: string; warning: string }> = [];
  let successfulFiles = 0;

  for (const file of files) {
    try {
      const content = await file.text();
      const result = parseConfiguration(content);

      // Add source file to result
      result.sourceFile = file.name;
      fileResults.push({ file: file.name, result });

      if (result.success) {
        successfulFiles++;
        // Add servers with source file information
        const serversWithSource: ServerWithSource[] = result.servers.map(server => ({
          ...server,
          sourceFile: file.name,
        }));
        allServers.push(...serversWithSource);
      }

      // Aggregate errors and warnings
      result.errors.forEach(error => {
        allErrors.push({ file: file.name, error });
      });
      result.warnings.forEach(warning => {
        allWarnings.push({ file: file.name, warning });
      });
    } catch (error) {
      allErrors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Failed to process file',
      });
    }
  }

  return {
    success: successfulFiles > 0,
    servers: allServers,
    errors: allErrors,
    warnings: allWarnings,
    fileResults,
    totalFiles: files.length,
    successfulFiles,
  };
}

/**
 * Filter files to only include JSON files
 */
export function filterJsonFiles(files: File[]): File[] {
  return files.filter(file =>
    file.name.toLowerCase().endsWith('.json') &&
    file.type === 'application/json' || file.type === ''
  );
}

/**
 * Get example Claude Desktop configuration
 */
export function getExampleConfig(): string {
  const example: ClaudeDesktopConfig = {
    mcpServers: {
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
      },
      'github': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: 'your_token_here',
        },
      },
      'postgres': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      },
      'brave-search': {
        url: 'https://api.brave.com/mcp',
        transport: 'http',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
        },
      },
    },
  };

  return JSON.stringify(example, null, 2);
}

