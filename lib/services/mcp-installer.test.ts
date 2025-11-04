/**
 * MCP Installer Service Tests
 * Tests for server installation from npm, GitHub, and local paths
 */

import {
  validateInstallation,
  getInstallationProgress,
  cancelInstallation,
  cleanupInstallation,
  installNPMPackage,
  installGitHubRepo,
  installLocalPath,
  installServer,
} from './mcp-installer';

// Mock child_process
const mockSpawn = jest.fn();
const mockExec = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
  exec: (cmd: string, callback: any) => {
    // Mock successful execution for version checks
    if (cmd.includes('--version')) {
      callback(null, { stdout: '1.0.0', stderr: '' });
    } else {
      callback(null, { stdout: '', stderr: '' });
    }
  },
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true }),
}));

describe('MCP Installer Service', () => {
  // Get references to mocked modules
  const fs = require('fs');
  const fsPromises = require('fs/promises');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fs/promises mocks to default behavior
    fsPromises.access.mockResolvedValue(undefined);
    fsPromises.stat.mockResolvedValue({ isDirectory: () => true });
    fs.existsSync.mockReturnValue(true);
  });

  describe('validateInstallation', () => {
    it('should validate npm package name', async () => {
      const result = await validateInstallation({
        source: 'npm',
        packageName: '@modelcontextprotocol/server-example',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid npm package names', async () => {
      const result = await validateInstallation({
        source: 'npm',
        packageName: '../../../etc/passwd',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate GitHub repository URL', async () => {
      const result = await validateInstallation({
        source: 'github',
        repository: 'https://github.com/user/repo',
      });

      expect(result.valid).toBe(true);
    });

    it('should reject invalid GitHub URLs', async () => {
      const result = await validateInstallation({
        source: 'github',
        repository: 'not-a-url',
      });

      expect(result.valid).toBe(false);
    });

    it('should validate local path', async () => {
      // Use a path within process.cwd() which is an allowed directory
      const testPath = require('path').join(process.cwd(), 'mcp-servers', 'test-server');

      const result = await validateInstallation({
        source: 'local',
        path: testPath,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject non-existent local paths', async () => {
      fsPromises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await validateInstallation({
        source: 'local',
        path: '/non/existent/path',
      });

      expect(result.valid).toBe(false);
    });

    it('should reject path traversal attempts', async () => {
      const result = await validateInstallation({
        source: 'local',
        path: '../../../etc/passwd',
      });

  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(expect.stringContaining('outside allowed directories'));
    });
  });

  describe('installNPMPackage', () => {
    it('should install npm package', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const installId = await installNPMPackage({
        packageName: '@test/package',
        version: '1.0.0',
      });

      expect(installId).toBeTruthy();
      expect(mockSpawn).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['install', '@test/package@1.0.0']),
        expect.any(Object)
      );
    });

    it('should handle installation errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const installId = await installNPMPackage({ packageName: '@test/package' });
      // Allow mocked close callback to fire
      await new Promise((r) => setTimeout(r, 120));
      const progress = getInstallationProgress(installId);
      expect(progress?.status).toBe('failed');
    });

    it('should sanitize package arguments', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await installNPMPackage({
        packageName: '@test/package; rm -rf /',
      });

      // Should sanitize malicious input
      const spawnArgs = mockSpawn.mock.calls[0][1];
      expect(spawnArgs.join(' ')).not.toContain(';');
      expect(spawnArgs.join(' ')).not.toContain('rm -rf');
    });

    it('should track installation progress', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Installing...'));
            }
          }),
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const installId = await installNPMPackage({
        packageName: '@test/package',
      });

      const progress = getInstallationProgress(installId);
      expect(progress).toBeDefined();
    });
  });

  describe('installGitHubRepo', () => {
    it('should clone GitHub repository', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const installId = await installGitHubRepo({
        repository: 'https://github.com/user/repo',
      });

      expect(installId).toBeTruthy();
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['clone']),
        expect.any(Object)
      );
    });

    it('should clone specific branch', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await installGitHubRepo({
        repository: 'https://github.com/user/repo',
        branch: 'develop',
      });

      const spawnArgs = mockSpawn.mock.calls[0][1];
      expect(spawnArgs).toContain('--branch');
      expect(spawnArgs).toContain('develop');
    });

    it('should handle clone errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(128), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await expect(
        installGitHubRepo({ repository: 'https://github.com/user/repo' })
      ).rejects.toThrow();
    });
  });

  describe('installLocalPath', () => {
    it('should install from local path', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ name: 'test-server', version: '1.0.0' })
      );

      const installId = await installLocalPath({
        path: '/path/to/server',
      });

      expect(installId).toBeTruthy();
    });

    it('should validate path exists', async () => {
      fsPromises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(
        installLocalPath({ path: '/non/existent/path' })
      ).rejects.toThrow();
    });

    it('should reject unsafe paths', async () => {
      await expect(
        installLocalPath({ path: '../../../etc/passwd' })
      ).rejects.toThrow();
    });
  });

  describe('installServer', () => {
    it('should route to correct installer based on source', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await installServer({
        source: 'npm',
        packageName: '@test/package',
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'npm',
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should handle GitHub source', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        }),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await installServer({
        source: 'github',
        repository: 'https://github.com/user/repo',
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should handle local source', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ name: 'test-server' })
      );

      // Use a path within allowed directories
      const testPath = require('path').join(process.cwd(), 'mcp-servers', 'test-server');

      await installServer({
        source: 'local',
        path: testPath,
      });

      expect(fs.existsSync).toHaveBeenCalled();
    });
  });

  describe('Installation Management', () => {
    describe('getInstallationProgress', () => {
      it('should return installation progress', async () => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
        };

        mockSpawn.mockReturnValue(mockProcess);

        const installId = await installNPMPackage({
          packageName: '@test/package',
        });

        const progress = getInstallationProgress(installId);

        expect(progress).toMatchObject({
          installId,
          status: expect.any(String),
        });
      });

      it('should return null for non-existent installation', () => {
        const progress = getInstallationProgress('non-existent-id');
        expect(progress).toBeUndefined();
      });
    });

    describe('cancelInstallation', () => {
      it('should cancel ongoing installation', async () => {
        const mockKill = jest.fn();
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: mockKill,
        };

        mockSpawn.mockReturnValue(mockProcess);

        const installId = await installNPMPackage({
          packageName: '@test/package',
        });

        await cancelInstallation(installId);

        expect(mockKill).toHaveBeenCalled();
      });
    });

    describe('cleanupInstallation', () => {
      it('should cleanup installation files', async () => {
        fs.existsSync.mockReturnValue(true);

        await cleanupInstallation('test-install-id');

        expect(fs.rmSync).toHaveBeenCalled();
      });
    });
  });
});

