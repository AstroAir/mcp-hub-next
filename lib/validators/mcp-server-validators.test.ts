/**
 * MCP Server Configuration Validators Tests
 */

import {
  validateBaseConfig,
  validateStdioConfig,
  validateSSEConfig,
  validateHTTPConfig,
  validateFilesystemServer,
  validateGitHubServer,
  validatePostgresServer,
  validateSQLiteServer,
  validateSlackServer,
  validateBraveSearchServer,
  validateServerConfig,
} from './mcp-server-validators';
import type { MCPServerConfig } from '@/lib/types';

describe('mcp-server-validators', () => {
  describe('validateBaseConfig', () => {
    it('validates valid base config', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
      };
      const result = validateBaseConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects config without name', () => {
      const config: Partial<MCPServerConfig> = {
        transportType: 'stdio',
      };
      const result = validateBaseConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Server name is required');
    });

    it('rejects config with empty name', () => {
      const config: Partial<MCPServerConfig> = {
        name: '   ',
        transportType: 'stdio',
      };
      const result = validateBaseConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Server name is required');
    });

    it('rejects config without transport type', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
      };
      const result = validateBaseConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transport type is required');
    });
  });

  describe('validateStdioConfig', () => {
    it('validates valid stdio config', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
        command: 'node',
        args: ['server.js'],
      };
      const result = validateStdioConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-stdio transport type', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'sse',
        command: 'node',
      };
      const result = validateStdioConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid transport type for stdio configuration');
    });

    it('rejects config without command', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
      };
      const result = validateStdioConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Command is required for stdio transport');
    });

    it('rejects config with empty command', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
        command: '   ',
      };
      const result = validateStdioConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Command is required for stdio transport');
    });
  });

  describe('validateSSEConfig', () => {
    it('validates valid SSE config', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'sse',
        url: 'https://example.com/sse',
      };
      const result = validateSSEConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-sse transport type', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
        url: 'https://example.com/sse',
      };
      const result = validateSSEConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid transport type for SSE configuration');
    });

    it('rejects config without URL', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'sse',
      };
      const result = validateSSEConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL is required for SSE transport');
    });

    it('rejects config with invalid URL format', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'sse',
        url: 'not-a-valid-url',
      };
      const result = validateSSEConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('rejects config with non-HTTP protocol', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'sse',
        url: 'ftp://example.com/sse',
      };
      const result = validateSSEConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL must use HTTP or HTTPS protocol');
    });
  });

  describe('validateHTTPConfig', () => {
    it('validates valid HTTP config', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'http',
        url: 'https://example.com/api',
      };
      const result = validateHTTPConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-http transport type', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'stdio',
        url: 'https://example.com/api',
      };
      const result = validateHTTPConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid transport type for HTTP configuration');
    });

    it('rejects config without URL', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Test Server',
        transportType: 'http',
      };
      const result = validateHTTPConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL is required for HTTP transport');
    });
  });

  describe('validateFilesystemServer', () => {
    it('validates filesystem server with allowed directories', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Filesystem Server',
        transportType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user/documents'],
      };
      const result = validateFilesystemServer(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns when no directory paths found', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Filesystem Server',
        transportType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
      };
      const result = validateFilesystemServer(config);
      expect(result.warnings).toContain('No file path specified - filesystem access may be limited');
    });
  });

  describe('validateGitHubServer', () => {
    it('validates GitHub server with token', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'GitHub Server',
        transportType: 'stdio',
        command: 'npx',
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_test123' },
      };
      const result = validateGitHubServer(config);
      expect(result.valid).toBe(true);
    });

    it('rejects GitHub server without env', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'GitHub Server',
        transportType: 'stdio',
        command: 'npx',
      };
      const result = validateGitHubServer(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
    });

    it('rejects GitHub server without token', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'GitHub Server',
        transportType: 'stdio',
        command: 'npx',
        env: {},
      };
      const result = validateGitHubServer(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
    });
  });

  describe('validateServerConfig', () => {
    it('routes to filesystem validator', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Filesystem Server',
        transportType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
      };
      const result = validateServerConfig(config);
      // Should use filesystem validator which checks for file paths
      expect(result.warnings).toContain('No file path specified - filesystem access may be limited');
    });

    it('routes to github validator', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'GitHub Server',
        transportType: 'stdio',
        command: 'npx',
      };
      const result = validateServerConfig(config);
      // Should use GitHub validator which requires env vars
      expect(result.errors).toContain('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
    });

    it('uses stdio validator for unknown server types', () => {
      const config: Partial<MCPServerConfig> = {
        name: 'Custom Server',
        transportType: 'stdio',
        command: 'node',
      };
      const result = validateServerConfig(config);
      expect(result.valid).toBe(true);
    });
  });
});

