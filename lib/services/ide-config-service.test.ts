/**
 * IDE Config Service Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock tauri-bridge before importing the service
const mockIsTauri = jest.fn();
const mockInvoke = jest.fn();

jest.mock('./tauri-bridge', () => ({
  isTauri: mockIsTauri,
  invoke: mockInvoke,
}));

// Mock config parser
jest.mock('@/lib/utils/config-parser', () => ({
  parseConfiguration: jest.fn(),
  validateConfigFile: jest.fn(),
}));

// Import after mocks are set up
import * as ideConfigService from './ide-config-service';

describe('IDE Config Service', () => {
  beforeEach(() => {
    mockIsTauri.mockClear();
    mockInvoke.mockClear();
  });

  describe('discoverIDEConfigs', () => {
    it('should call Tauri command in desktop mode', async () => {
      const mockDiscoveries = [
        {
          clientType: 'claude-desktop',
          configPath: '/path/to/config.json',
          found: true,
          readable: true,
          serverCount: 2,
        },
      ];

      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue(mockDiscoveries);

      const result = await ideConfigService.discoverIDEConfigs();

      expect(mockInvoke).toHaveBeenCalledWith('discover_ide_configs');
      expect(result).toEqual(mockDiscoveries);
    });

    it('should return empty array in web mode', async () => {
      mockIsTauri.mockReturnValue(false);

      const result = await ideConfigService.discoverIDEConfigs();

      expect(result).toEqual([]);
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('validateIDEConfig', () => {
    it('should call Tauri command in desktop mode', async () => {
      const mockValidation = {
        valid: true,
        clientType: 'claude-desktop',
        errors: [],
        warnings: [],
        serverCount: 2,
      };

      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue(mockValidation);

      const result = await ideConfigService.validateIDEConfig('/path/to/config.json', 'claude-desktop');

      expect(mockInvoke).toHaveBeenCalledWith('validate_ide_config', {
        path: '/path/to/config.json',
        clientType: 'claude-desktop',
      });
      expect(result).toEqual(mockValidation);
    });
  });

  describe('importIDEConfig', () => {
    it('should call Tauri command in desktop mode', async () => {
      const mockServers = [
        {
          id: '1',
          name: 'Test Server',
          transportType: 'stdio' as const,
          command: 'test',
          args: [],
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue(JSON.stringify(mockServers));

      const result = await ideConfigService.importIDEConfig(
        '/path/to/config.json',
        'claude-desktop',
        'merge'
      );

      expect(mockInvoke).toHaveBeenCalledWith('import_ide_config', {
        path: '/path/to/config.json',
        clientType: 'claude-desktop',
        mergeStrategy: 'merge',
      });
      expect(result).toEqual(mockServers);
    });
  });

  describe('exportToIDEFormat', () => {
    it('should call Tauri command in desktop mode', async () => {
      const mockServers = [
        {
          id: '1',
          name: 'Test Server',
          transportType: 'stdio' as const,
          command: 'test',
          args: [],
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockJson = '{"mcpServers":{"Test Server":{"command":"test","args":[]}}}';

      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue(mockJson);

      const result = await ideConfigService.exportToIDEFormat(
        mockServers,
        'claude-desktop',
        '/path/to/output.json'
      );

      expect(mockInvoke).toHaveBeenCalledWith('export_to_ide_format', {
        serversJson: JSON.stringify(mockServers),
        clientType: 'claude-desktop',
        outputPath: '/path/to/output.json',
      });
      expect(result).toEqual(mockJson);
    });

    it('should generate JSON in web mode', async () => {
      const mockServers = [
        {
          id: '1',
          name: 'Test Server',
          transportType: 'stdio' as const,
          command: 'test',
          args: ['--arg'],
          env: { KEY: 'value' },
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockIsTauri.mockReturnValue(false);

      const result = await ideConfigService.exportToIDEFormat(mockServers, 'claude-desktop');

      const parsed = JSON.parse(result);
      expect(parsed.mcpServers['Test Server']).toEqual({
        command: 'test',
        args: ['--arg'],
        env: { KEY: 'value' },
      });
    });
  });
});

