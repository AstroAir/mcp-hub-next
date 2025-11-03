/**
 * MCP Process Manager Service Tests
 * Tests for process lifecycle management
 */

import {
  getProcessState,
  getAllProcesses,
  startServer,
  stopServer,
  restartServer,
  cleanupAllProcesses,
  forceCleanupSync,
} from './mcp-process-manager';

// Mock child_process
const mockSpawn = jest.fn();
jest.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

describe('MCP Process Manager Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    forceCleanupSync();
  });

  afterEach(() => {
    forceCleanupSync();
  });

  describe('startServer', () => {
    it('should start a server process', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      };

      await startServer('server1', config);

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['server.js'],
        expect.any(Object)
      );

      const state = getProcessState('server1');
      expect(state?.state).toBe('running');
      expect(state?.pid).toBe(12345);
    });

    it('should pass environment variables to process', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
        env: {
          NODE_ENV: 'production',
          API_KEY: 'secret',
        },
      };

      await startServer('server1', config);

      const spawnOptions = mockSpawn.mock.calls[0][2];
      expect(spawnOptions.env).toMatchObject({
        NODE_ENV: 'production',
        API_KEY: 'secret',
      });
    });

    it('should set working directory', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
        cwd: '/path/to/server',
      };

      await startServer('server1', config);

      const spawnOptions = mockSpawn.mock.calls[0][2];
      expect(spawnOptions.cwd).toBe('/path/to/server');
    });

    it('should handle spawn errors', async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const config = {
        command: 'invalid-command',
        args: [],
        transportType: 'stdio' as const,
      };

      await expect(startServer('server1', config)).rejects.toThrow('Spawn failed');
    });

    it('should not start duplicate processes', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      };

      const firstStart = await startServer('server1', config);
      const secondStart = await startServer('server1', config);

      // Should return the same process state
      expect(secondStart).toBe(firstStart);
      expect(mockSpawn).toHaveBeenCalledTimes(1); // Should only spawn once
    });

    it('should capture stdout and stderr', async () => {
      const stdoutCallback = jest.fn();
      const stderrCallback = jest.fn();

      const mockProcess = {
        pid: 12345,
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              stdoutCallback.mockImplementation(callback);
            }
          }),
        },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              stderrCallback.mockImplementation(callback);
            }
          }),
        },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      };

      await startServer('server1', config);

      // Simulate output
      stdoutCallback(Buffer.from('Server started'));
      stderrCallback(Buffer.from('Warning: deprecated API'));

      const state = getProcessState('server1');
      expect(state?.output).toContain('Server started');
      expect(state?.output).toContain('Warning: deprecated API');
    });
  });

  describe('stopServer', () => {
    it('should stop a running server', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        // Simulate process exit when killed
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      };

      await startServer('server1', config);
      await stopServer('server1');

      expect(mockKill).toHaveBeenCalled();

      const state = getProcessState('server1');
      expect(state).toBeNull(); // Process should be removed after stopping
    });

    it('should handle stopping non-existent server', async () => {
      await expect(stopServer('non-existent')).rejects.toThrow();
    });

    it('should use SIGTERM by default', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      await stopServer('server1');

      expect(mockKill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should force kill with SIGKILL if needed', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      await stopServer('server1', { force: true });

      expect(mockKill).toHaveBeenCalledWith('SIGKILL');
    });
  });

  describe('restartServer', () => {
    it('should restart a server', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      const config = {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      };

      await startServer('server1', config);
      await restartServer('server1');

      expect(mockKill).toHaveBeenCalled();
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });

    it('should handle restart failures', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn
        .mockReturnValueOnce(mockProcess)
        .mockImplementationOnce(() => {
          throw new Error('Restart failed');
        });

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      await expect(restartServer('server1')).rejects.toThrow('Restart failed');
    });

    it('should track restart attempts', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      await restartServer('server1');
      await restartServer('server1');

      const state = getProcessState('server1');
      expect(state?.restartCount).toBe(2);
    });

    it('should limit restart attempts', async () => {
      // Create a factory for mock processes with exit callbacks
      const createMockProcess = () => {
        const exitCallbacks: Array<(code: number) => void> = [];
        const mockKill = jest.fn().mockImplementation(() => {
          setImmediate(() => {
            exitCallbacks.forEach(cb => cb(0));
            exitCallbacks.length = 0; // Clear callbacks after calling
          });
        });
        return {
          pid: 12345,
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn().mockImplementation((event: string, callback: any) => {
            if (event === 'exit') {
              exitCallbacks.push(callback);
            }
          }),
          kill: mockKill,
        };
      };

      // Return a new mock process for each spawn call
      mockSpawn.mockImplementation(() => createMockProcess());

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      // Attempt multiple restarts - should stop after MAX_RESTART_ATTEMPTS (3)
      let lastError: any;
      for (let i = 0; i < 5; i++) {
        try {
          await restartServer('server1');
        } catch (error) {
          lastError = error;
          // Expected to fail after max attempts
          break;
        }
      }

      // Should have thrown an error about max attempts
      expect(lastError).toBeDefined();
      expect(lastError.message).toContain('Maximum restart attempts');

      const state = getProcessState('server1');
      expect(state?.restartCount).toBeLessThanOrEqual(3); // MAX_RESTART_ATTEMPTS
    }, 10000); // 10 second timeout for multiple restarts with 1s delays
  });

  describe('getProcessState', () => {
    it('should return process state', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server.js'],
        transportType: 'stdio' as const,
      });

      const state = getProcessState('server1');

      expect(state).toMatchObject({
        serverId: 'server1',
        state: 'running',
        pid: 12345,
        startedAt: expect.any(String),
        restartCount: 0,
      });
    });

    it('should return null for non-existent process', () => {
      const state = getProcessState('non-existent');
      expect(state).toBeNull();
    });
  });

  describe('getAllProcesses', () => {
    it('should return all process states', async () => {
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server1.js'],
        transportType: 'stdio' as const,
      });

      await startServer('server2', {
        command: 'node',
        args: ['server2.js'],
        transportType: 'stdio' as const,
      });

      const allProcesses = getAllProcesses();

      expect(Object.keys(allProcesses)).toHaveLength(2);
      expect(allProcesses['server1']).toBeDefined();
      expect(allProcesses['server2']).toBeDefined();
    });

    it('should return empty object when no processes', () => {
      const allProcesses = getAllProcesses();
      expect(allProcesses).toEqual({});
    });
  });

  describe('cleanupAllProcesses', () => {
    it('should stop all running processes', async () => {
      const exitCallbacks: Array<(code: number) => void> = [];
      const mockKill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          exitCallbacks.forEach(cb => cb(0));
        });
      });
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'exit') {
            exitCallbacks.push(callback);
          }
        }),
        kill: mockKill,
      };

      mockSpawn.mockReturnValue(mockProcess);

      await startServer('server1', {
        command: 'node',
        args: ['server1.js'],
        transportType: 'stdio' as const,
      });

      await startServer('server2', {
        command: 'node',
        args: ['server2.js'],
        transportType: 'stdio' as const,
      });

      await cleanupAllProcesses();

      expect(mockKill).toHaveBeenCalledTimes(2);

      const allProcesses = getAllProcesses();
      expect(Object.keys(allProcesses)).toHaveLength(0);
    });
  });
});

