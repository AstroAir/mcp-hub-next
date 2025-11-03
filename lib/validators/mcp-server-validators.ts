/**
 * MCP Server Configuration Validators
 * Provider-specific validation logic for different MCP servers
 */

import type { MCPServerConfig } from '@/lib/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base validator for all MCP servers
 */
export function validateBaseConfig(config: Partial<MCPServerConfig>): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check required fields
  if (!config.name || config.name.trim() === '') {
    result.errors.push('Server name is required');
    result.valid = false;
  }

  if (!config.transportType) {
    result.errors.push('Transport type is required');
    result.valid = false;
  }

  return result;
}

/**
 * Validate stdio transport configuration
 */
export function validateStdioConfig(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateBaseConfig(config);

  if (config.transportType !== 'stdio') {
    result.errors.push('Invalid transport type for stdio configuration');
    result.valid = false;
    return result;
  }

  const stdioConfig = config as { command?: string; args?: string[] };

  if (!stdioConfig.command || stdioConfig.command.trim() === '') {
    result.errors.push('Command is required for stdio transport');
    result.valid = false;
  }

  return result;
}

/**
 * Validate SSE transport configuration
 */
export function validateSSEConfig(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateBaseConfig(config);

  if (config.transportType !== 'sse') {
    result.errors.push('Invalid transport type for SSE configuration');
    result.valid = false;
    return result;
  }

  const sseConfig = config as { url?: string };

  if (!sseConfig.url || sseConfig.url.trim() === '') {
    result.errors.push('URL is required for SSE transport');
    result.valid = false;
  } else {
    try {
      const url = new URL(sseConfig.url);
      if (!url.protocol.startsWith('http')) {
        result.errors.push('URL must use HTTP or HTTPS protocol');
        result.valid = false;
      }
    } catch {
      result.errors.push('Invalid URL format');
      result.valid = false;
    }
  }

  return result;
}

/**
 * Validate HTTP transport configuration
 */
export function validateHTTPConfig(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateBaseConfig(config);

  if (config.transportType !== 'http') {
    result.errors.push('Invalid transport type for HTTP configuration');
    result.valid = false;
    return result;
  }

  const httpConfig = config as { url?: string };

  if (!httpConfig.url || httpConfig.url.trim() === '') {
    result.errors.push('URL is required for HTTP transport');
    result.valid = false;
  } else {
    try {
      const url = new URL(httpConfig.url);
      if (!url.protocol.startsWith('http')) {
        result.errors.push('URL must use HTTP or HTTPS protocol');
        result.valid = false;
      }
    } catch {
      result.errors.push('Invalid URL format');
      result.valid = false;
    }
  }

  return result;
}

/**
 * Validate filesystem server configuration
 */
export function validateFilesystemServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateStdioConfig(config);

  const stdioConfig = config as { command?: string; args?: string[] };

  if (stdioConfig.command === 'npx' && stdioConfig.args) {
    const hasPackage = stdioConfig.args.some((arg) =>
      arg.includes('@modelcontextprotocol/server-filesystem')
    );
    if (!hasPackage) {
      result.warnings.push('Expected @modelcontextprotocol/server-filesystem package');
    }

    const hasPath = stdioConfig.args.some((arg) => arg.startsWith('/') || arg.includes(':\\'));
    if (!hasPath) {
      result.warnings.push('No file path specified - filesystem access may be limited');
    }
  }

  return result;
}

/**
 * Validate GitHub server configuration
 */
export function validateGitHubServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateStdioConfig(config);

  const stdioConfig = config as { env?: Record<string, string> };

  if (!stdioConfig.env || !stdioConfig.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    result.errors.push('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
    result.valid = false;
  } else {
    const token = stdioConfig.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      result.warnings.push('Token format may be invalid - GitHub tokens typically start with ghp_ or github_pat_');
    }
  }

  return result;
}

/**
 * Validate PostgreSQL server configuration
 */
export function validatePostgresServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateStdioConfig(config);

  const stdioConfig = config as { args?: string[] };

  if (stdioConfig.args && stdioConfig.args.length > 0) {
    const connectionString = stdioConfig.args.find((arg) => arg.startsWith('postgresql://'));
    if (!connectionString) {
      result.warnings.push('No PostgreSQL connection string found in arguments');
    } else {
      try {
        const url = new URL(connectionString);
        if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
          result.warnings.push('Connection string should use postgresql:// protocol');
        }
      } catch {
        result.errors.push('Invalid PostgreSQL connection string format');
        result.valid = false;
      }
    }
  }

  return result;
}

/**
 * Validate SQLite server configuration
 */
export function validateSQLiteServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateStdioConfig(config);

  const stdioConfig = config as { args?: string[] };

  if (stdioConfig.args && stdioConfig.args.length > 0) {
    const dbPath = stdioConfig.args.find((arg) => arg.endsWith('.db') || arg.endsWith('.sqlite'));
    if (!dbPath) {
      result.warnings.push('No SQLite database file path found in arguments');
    }
  }

  return result;
}

/**
 * Validate Slack server configuration
 */
export function validateSlackServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateStdioConfig(config);

  const stdioConfig = config as { env?: Record<string, string> };

  if (!stdioConfig.env) {
    result.errors.push('Environment variables are required for Slack server');
    result.valid = false;
    return result;
  }

  if (!stdioConfig.env.SLACK_BOT_TOKEN) {
    result.errors.push('SLACK_BOT_TOKEN environment variable is required');
    result.valid = false;
  } else {
    const token = stdioConfig.env.SLACK_BOT_TOKEN;
    if (!token.startsWith('xoxb-') && !token.startsWith('xoxp-')) {
      result.warnings.push('Token format may be invalid - Slack tokens typically start with xoxb- or xoxp-');
    }
  }

  if (!stdioConfig.env.SLACK_TEAM_ID) {
    result.errors.push('SLACK_TEAM_ID environment variable is required');
    result.valid = false;
  }

  return result;
}

/**
 * Validate Brave Search server configuration
 */
export function validateBraveSearchServer(config: Partial<MCPServerConfig>): ValidationResult {
  const result = validateHTTPConfig(config);

  const httpConfig = config as { headers?: Record<string, string> };

  if (!httpConfig.headers || !httpConfig.headers.Authorization) {
    result.errors.push('Authorization header with API key is required');
    result.valid = false;
  }

  return result;
}

/**
 * Main validation function - routes to appropriate validator
 */
export function validateServerConfig(config: Partial<MCPServerConfig>): ValidationResult {
  // Determine server type from name or package
  const name = config.name?.toLowerCase() || '';

  if (name.includes('filesystem')) {
    return validateFilesystemServer(config);
  }

  if (name.includes('github')) {
    return validateGitHubServer(config);
  }

  if (name.includes('postgres')) {
    return validatePostgresServer(config);
  }

  if (name.includes('sqlite')) {
    return validateSQLiteServer(config);
  }

  if (name.includes('slack')) {
    return validateSlackServer(config);
  }

  if (name.includes('brave')) {
    return validateBraveSearchServer(config);
  }

  // Default validation based on transport type
  switch (config.transportType) {
    case 'stdio':
      return validateStdioConfig(config);
    case 'sse':
      return validateSSEConfig(config);
    case 'http':
      return validateHTTPConfig(config);
    default:
      return validateBaseConfig(config);
  }
}

