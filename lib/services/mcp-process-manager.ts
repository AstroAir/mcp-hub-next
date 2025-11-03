/**
 * MCP Server Process Manager
 * Manages lifecycle of MCP server processes (start, stop, restart, monitoring)
 */

import { spawn, ChildProcess } from 'child_process';
import type {
  MCPServerConfig,
  StdioMCPServerConfig,
  MCPServerProcess,
} from '@/lib/types';

/**
 * Active server processes
 */
const activeProcesses = new Map<string, {
  process: ChildProcess;
  config: MCPServerConfig;
  state: MCPServerProcess;
}>();

/**
 * Process monitoring intervals
 */
const monitoringIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Maximum restart attempts before giving up
 */
const MAX_RESTART_ATTEMPTS = 3;

/**
 * Restart attempt tracking
 */
const restartAttempts = new Map<string, number>();

/**
 * Get process state
 */
export function getProcessState(serverId: string): MCPServerProcess | undefined {
  const entry = activeProcesses.get(serverId);
  return entry?.state;
}

/**
 * Get all running processes
 */
export function getAllProcesses(): MCPServerProcess[] {
  return Array.from(activeProcesses.values()).map((entry) => entry.state);
}

/**
 * Update process state
 */
function updateProcessState(
  serverId: string,
  updates: Partial<MCPServerProcess>
): MCPServerProcess | undefined {
  const entry = activeProcesses.get(serverId);
  if (!entry) {
    return undefined;
  }

  entry.state = {
    ...entry.state,
    ...updates,
  };

  return entry.state;
}

/**
 * Calculate process uptime
 */
function calculateUptime(startedAt?: string): number {
  if (!startedAt) {
    return 0;
  }

  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000); // Return seconds
}

/**
 * Monitor process health
 */
function startProcessMonitoring(serverId: string): void {
  // Clear existing interval if any
  const existingInterval = monitoringIntervals.get(serverId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  // Monitor every 5 seconds
  const interval = setInterval(() => {
    const entry = activeProcesses.get(serverId);
    if (!entry) {
      clearInterval(interval);
      monitoringIntervals.delete(serverId);
      return;
    }

    const { process: childProcess, state } = entry;

    // Check if process is still running
    if (childProcess.killed || childProcess.exitCode !== null) {
      updateProcessState(serverId, {
        state: 'error',
        lastError: 'Process terminated unexpectedly',
        stoppedAt: new Date().toISOString(),
      });
      clearInterval(interval);
      monitoringIntervals.delete(serverId);
      return;
    }

    // Update uptime
    const uptime = calculateUptime(state.startedAt);
    
    // Get memory usage if available
    let memoryUsage: number | undefined;
    let cpuUsage: number | undefined;

    try {
      if (childProcess.pid) {
        // Note: This is a simplified approach
        // In production, you might want to use a library like 'pidusage'
        memoryUsage = (process.memoryUsage().heapUsed);
      }
    } catch {
      // Ignore errors getting process stats
    }

    updateProcessState(serverId, {
      uptime,
      memoryUsage,
      cpuUsage,
    });
  }, 5000);

  monitoringIntervals.set(serverId, interval);
}

/**
 * Stop process monitoring
 */
function stopProcessMonitoring(serverId: string): void {
  const interval = monitoringIntervals.get(serverId);
  if (interval) {
    clearInterval(interval);
    monitoringIntervals.delete(serverId);
  }
}

/**
 * Start MCP server process
 */
export async function startServer(
  serverId: string,
  config: MCPServerConfig
): Promise<MCPServerProcess> {
  // Check if already running
  const existing = activeProcesses.get(serverId);
  if (existing && existing.state.state === 'running') {
    return existing.state;
  }

  // Only stdio transport supports process management
  if (config.transportType !== 'stdio') {
    throw new Error(`Process management not supported for ${config.transportType} transport`);
  }

  const stdioConfig = config as StdioMCPServerConfig;

  // Initialize process state
  const processState: MCPServerProcess = {
    serverId,
    state: 'starting',
    startedAt: new Date().toISOString(),
    restartCount: restartAttempts.get(serverId) || 0,
  };

  try {
    // Spawn the process
    const childProcess = spawn(stdioConfig.command, stdioConfig.args || [], {
      cwd: stdioConfig.cwd || process.cwd(),
      env: stdioConfig.env ? { ...process.env, ...stdioConfig.env } : process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Store process info
    processState.pid = childProcess.pid;
    processState.state = 'running';

    activeProcesses.set(serverId, {
      process: childProcess,
      config,
      state: processState,
    });

    // Handle process events
    childProcess.on('error', (error) => {
      updateProcessState(serverId, {
        state: 'error',
        lastError: error.message,
        stoppedAt: new Date().toISOString(),
      });
      stopProcessMonitoring(serverId);
    });

    childProcess.on('exit', (code, signal) => {
      const exitMessage = signal 
        ? `Process killed with signal ${signal}`
        : `Process exited with code ${code}`;

      updateProcessState(serverId, {
        state: code === 0 ? 'stopped' : 'error',
        lastError: code !== 0 ? exitMessage : undefined,
        stoppedAt: new Date().toISOString(),
      });
      
      stopProcessMonitoring(serverId);
      activeProcesses.delete(serverId);
    });

    // Capture stderr for errors
    childProcess.stderr?.on('data', (data) => {
      const errorMessage = data.toString();
      console.error(`[${serverId}] stderr:`, errorMessage);
      
      updateProcessState(serverId, {
        lastError: errorMessage.slice(0, 500), // Limit error message length
      });
    });

    // Start monitoring
    startProcessMonitoring(serverId);

    // Reset restart attempts on successful start
    restartAttempts.delete(serverId);

    return processState;
  } catch (error) {
    processState.state = 'error';
    processState.lastError = error instanceof Error ? error.message : 'Failed to start process';
    processState.stoppedAt = new Date().toISOString();
    
    throw error;
  }
}

/**
 * Stop MCP server process
 */
export async function stopServer(
  serverId: string,
  force: boolean = false
): Promise<void> {
  const entry = activeProcesses.get(serverId);
  if (!entry) {
    throw new Error(`No running process found for server: ${serverId}`);
  }

  const { process: childProcess } = entry;

  updateProcessState(serverId, {
    state: 'stopping',
  });

  try {
    if (force) {
      // Force kill
      childProcess.kill('SIGKILL');
    } else {
      // Graceful shutdown
      childProcess.kill('SIGTERM');

      // Wait up to 10 seconds for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown takes too long
          childProcess.kill('SIGKILL');
          resolve();
        }, 10000);

        childProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    updateProcessState(serverId, {
      state: 'stopped',
      stoppedAt: new Date().toISOString(),
    });

    stopProcessMonitoring(serverId);
    activeProcesses.delete(serverId);
  } catch (error) {
    updateProcessState(serverId, {
      state: 'error',
      lastError: error instanceof Error ? error.message : 'Failed to stop process',
    });
    
    throw error;
  }
}

/**
 * Restart MCP server process
 */
export async function restartServer(
  serverId: string,
  config?: MCPServerConfig
): Promise<MCPServerProcess> {
  const entry = activeProcesses.get(serverId);
  const serverConfig = config || entry?.config;

  if (!serverConfig) {
    throw new Error(`No configuration found for server: ${serverId}`);
  }

  // Track restart attempts
  const attempts = (restartAttempts.get(serverId) || 0) + 1;
  if (attempts > MAX_RESTART_ATTEMPTS) {
    throw new Error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) exceeded`);
  }
  restartAttempts.set(serverId, attempts);

  updateProcessState(serverId, {
    state: 'restarting',
  });

  try {
    // Stop if running
    if (entry) {
      await stopServer(serverId, false);
    }

    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start again
    const processState = await startServer(serverId, serverConfig);
    
    updateProcessState(serverId, {
      restartCount: attempts,
    });

    return processState;
  } catch (error) {
    updateProcessState(serverId, {
      state: 'error',
      lastError: error instanceof Error ? error.message : 'Failed to restart process',
    });
    
    throw error;
  }
}

/**
 * Cleanup all processes on shutdown
 */
export async function cleanupAllProcesses(): Promise<void> {
  const serverIds = Array.from(activeProcesses.keys());
  
  await Promise.all(
    serverIds.map((serverId) => 
      stopServer(serverId, true).catch((error) => {
        console.error(`Failed to stop server ${serverId}:`, error);
      })
    )
  );

  // Clear all monitoring intervals
  monitoringIntervals.forEach((interval) => clearInterval(interval));
  monitoringIntervals.clear();
  
  // Clear restart attempts
  restartAttempts.clear();
}

