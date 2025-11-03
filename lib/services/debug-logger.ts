/**
 * Debug Logger Service
 * Centralized logging for MCP protocol messages and errors
 */

import { nanoid } from 'nanoid';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'mcp' | 'connection' | 'tool' | 'chat' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  serverId?: string;
  serverName?: string;
  message: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  serverId: string;
  serverName: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
}

const MAX_LOGS = 1000;
const MAX_METRICS = 500;
const LOGS_KEY = 'mcp-hub-debug-logs';
const METRICS_KEY = 'mcp-hub-performance-metrics';

/**
 * Get all debug logs
 */
export function getDebugLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return [];

  return JSON.parse(stored);
}

/**
 * Add a debug log entry
 */
export function addDebugLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  options: {
    serverId?: string;
    serverName?: string;
    data?: unknown;
    error?: Error;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const entry: LogEntry = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...options,
  };

  if (options.error) {
    entry.error = {
      name: options.error.name,
      message: options.error.message,
      stack: options.error.stack,
    };
  }

  const logs = getDebugLogs();
  logs.unshift(entry);

  // Keep only the most recent logs
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }

  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${category}] ${message}`, options.data || '');
  }
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGS_KEY);
}

/**
 * Export debug logs as JSON
 */
export function exportDebugLogs(): void {
  if (typeof window === 'undefined') return;

  const logs = getDebugLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcp-hub-debug-logs-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(METRICS_KEY);
  if (!stored) return [];

  return JSON.parse(stored);
}

/**
 * Add a performance metric
 */
export function addPerformanceMetric(
  serverId: string,
  serverName: string,
  operation: string,
  duration: number,
  success: boolean,
  error?: string
): void {
  if (typeof window === 'undefined') return;

  const metric: PerformanceMetric = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    serverId,
    serverName,
    operation,
    duration,
    success,
    error,
  };

  const metrics = getPerformanceMetrics();
  metrics.unshift(metric);

  // Keep only the most recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.splice(MAX_METRICS);
  }

  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(METRICS_KEY);
}

/**
 * Get average performance for a server
 */
export function getServerPerformanceStats(serverId: string): {
  avgDuration: number;
  successRate: number;
  totalOperations: number;
} {
  const metrics = getPerformanceMetrics().filter((m) => m.serverId === serverId);

  if (metrics.length === 0) {
    return {
      avgDuration: 0,
      successRate: 0,
      totalOperations: 0,
    };
  }

  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  const successCount = metrics.filter((m) => m.success).length;

  return {
    avgDuration: totalDuration / metrics.length,
    successRate: (successCount / metrics.length) * 100,
    totalOperations: metrics.length,
  };
}

/**
 * Measure operation performance
 */
export async function measurePerformance<T>(
  serverId: string,
  serverName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await fn();
    success = true;
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = performance.now() - startTime;
    addPerformanceMetric(serverId, serverName, operation, duration, success, error);
  }
}

/**
 * Log MCP request
 */
export function logMCPRequest(
  serverId: string,
  serverName: string,
  method: string,
  params?: unknown
): void {
  addDebugLog('debug', 'mcp', `Request: ${method}`, {
    serverId,
    serverName,
    data: { method, params },
  });
}

/**
 * Log MCP response
 */
export function logMCPResponse(
  serverId: string,
  serverName: string,
  method: string,
  response: unknown
): void {
  addDebugLog('debug', 'mcp', `Response: ${method}`, {
    serverId,
    serverName,
    data: { method, response },
  });
}

/**
 * Log MCP error
 */
export function logMCPError(
  serverId: string,
  serverName: string,
  method: string,
  error: Error
): void {
  addDebugLog('error', 'mcp', `Error: ${method}`, {
    serverId,
    serverName,
    error,
  });
}

