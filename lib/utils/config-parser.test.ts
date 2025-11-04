import {
  parseClaudeDesktopConfig,
  parseConfiguration,
  validateConfigFile,
  exportToClaudeDesktopConfig,
  mergeServers,
  filterJsonFiles,
  getExampleConfig,
} from './config-parser';
import type { MCPServerConfig } from '../types';
import { createMockFile } from '../__tests__/test-utils';

jest.useFakeTimers();

describe('config-parser', () => {
  it('parses Claude Desktop config', () => {
    const json = JSON.stringify({
      mcpServers: {
        gh: { command: 'npx', args: ['@modelcontextprotocol/server-github'] },
        http: { url: 'https://api.example.com/mcp', transport: 'http' },
        sse: { url: 'https://api.example.com/mcp/sse' },
      },
    });
    const res = parseClaudeDesktopConfig(json);
    expect(res.success).toBe(true);
    expect(res.servers.length).toBe(3);
  });

  it('validateConfigFile enforces shape', () => {
    expect(validateConfigFile('{"mcpServers":{}}').valid).toBe(false);
    expect(validateConfigFile(getExampleConfig()).valid).toBe(true);
  });

  it('exportToClaudeDesktopConfig serializes servers', () => {
    const servers: MCPServerConfig[] = [
      {
        id: '1', name: 's1', description: '', createdAt: '', updatedAt: '',
        transportType: 'stdio', command: 'npx', args: ['x'],
      },
      {
        id: '2', name: 's2', description: '', createdAt: '', updatedAt: '',
        transportType: 'http', url: 'https://x',
      },
    ];
    const json = exportToClaudeDesktopConfig(servers);
    const parsed = JSON.parse(json);
    expect(parsed.mcpServers.s1.command).toBe('npx');
    expect(parsed.mcpServers.s2.url).toBe('https://x');
  });

  it('mergeServers dedupes names by appending counter', () => {
    const existing: MCPServerConfig[] = [
      { id: 'a', name: 'dup', description: '', createdAt: '', updatedAt: '', transportType: 'http', url: 'x' },
    ];
    const incoming: MCPServerConfig[] = [
      { id: 'b', name: 'dup', description: '', createdAt: '', updatedAt: '', transportType: 'http', url: 'y' },
      { id: 'c', name: 'unique', description: '', createdAt: '', updatedAt: '', transportType: 'http', url: 'z' },
    ];
    const merged = mergeServers(existing, incoming);
    const names = merged.map(s => s.name);
    expect(names).toEqual(['dup', 'dup (1)', 'unique']);
  });

  it('parseConfiguration auto-detects and parses', () => {
    const vs = JSON.stringify({
      'mcp.servers': { x: { command: 'npx' } }
    });
    const res = parseConfiguration(vs);
    expect(res.success).toBe(true);
    expect(res.servers.length).toBe(1);
  });

  it('filterJsonFiles only returns JSON-like File entries', () => {
    const files = [
      createMockFile('a.json', '{}', 'application/json'),
      createMockFile('b.txt', '{}', 'text/plain'),
      new File([new Blob(['{}'])], 'c.json', { type: '' }),
    ];
    const filtered = filterJsonFiles(files as any);
    expect(filtered.map(f => f.name)).toEqual(['a.json', 'c.json']);
  });
});
