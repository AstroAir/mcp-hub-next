import { detectIDEFormat, parseVSCodeConfig, parseCursorConfig, parseClineConfig } from './ide-config-parsers';

describe('ide-config-parsers', () => {
  it('detects formats', () => {
    expect(detectIDEFormat('{"mcp.servers":{}}')).toBe('vscode');
    expect(detectIDEFormat('{"cursor.mcp.servers":{}}')).toBe('cursor');
    expect(detectIDEFormat('{"mcpServers":{}}')).toBe('claude-desktop');
    expect(detectIDEFormat('not json')).toBe('unknown');
  });

  it('parses VS Code config with valid server', () => {
    const json = JSON.stringify({
      'mcp.servers': {
        fs: { command: 'npx', args: ['@modelcontextprotocol/server-filesystem'] },
        api: { url: 'https://api.example.com/mcp' },
      },
    });
    const res = parseVSCodeConfig(json);
    expect(res.success).toBe(true);
    expect(res.servers.length).toBe(2);
  });

  it('parses Cursor config supporting both keys', () => {
    const json = JSON.stringify({
      'cursor.mcp.servers': { s1: { command: 'x' } }
    });
    const res = parseCursorConfig(json);
    expect(res.success).toBe(true);
  });

  it('parses Cline config and errors on missing field', () => {
    const bad = parseClineConfig('{}');
    expect(bad.success).toBe(false);

    const good = parseClineConfig('{"mcpServers": {"h": {"url": "https://x"}}}');
    expect(good.success).toBe(true);
  });
});
