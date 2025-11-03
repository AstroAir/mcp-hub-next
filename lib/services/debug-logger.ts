/**
 * Debug Logger Service
 * Centralized logging for MCP protocol messages and errors
 */

import { nanoid } from 'nanoid';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'mcp' | 'connection' | 'tool' | 'chat' | 'system';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category?: LogCategory;
  serverId?: string;
  serverName?: string;
  message: string;
  metadata?: unknown;
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
  metadata?: unknown;
}

const MAX_LOGS = 1000;
const MAX_METRICS = 500;
const LOGS_KEY = 'mcp-hub-debug-logs';
const METRICS_KEY = 'mcp-hub-performance-metrics';

/**
 * Get all debug logs
 */
export function getDebugLogs(serverId?: string, level?: LogLevel): LogEntry[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return [];

  try {
    let logs: LogEntry[] = JSON.parse(stored);

    if (serverId) {
      logs = logs.filter(log => log.serverId === serverId);
    }

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    return logs;
  } catch {
    return [];
  }
}

/**
 * Add a debug log entry
 */
export function addDebugLog(
  options: {
    level: LogLevel;
    category?: LogCategory;
    message: string;
    serverId?: string;
    serverName?: string;
    metadata?: unknown;
    data?: unknown;
    error?: Error;
  }
): void {
  if (typeof window === 'undefined') return;

  const entry: LogEntry = {
    id: nanoid(),
    timestamp: Date.now(),
    level: options.level,
    category: options.category,
    message: options.message,
    serverId: options.serverId,
    serverName: options.serverName,
    metadata: options.metadata,
    data: options.data,
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
    const consoleMethod = options.level === 'error' ? 'error' : options.level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${options.category || 'log'}] ${options.message}`, options.metadata || options.data || '');
  }
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs(serverId?: string): void {
  if (typeof window === 'undefined') return;

  if (!serverId) {
    localStorage.removeItem(LOGS_KEY);
    return;
  }

  const logs = getDebugLogs();
  const filtered = logs.filter(log => log.serverId !== serverId);
  localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
}

/**
 * Export debug logs as JSON
 */
export function exportDebugLogs(serverId?: string): string {
  if (typeof window === 'undefined') return '[]';

  const logs = getDebugLogs(serverId);
  return JSON.stringify(logs, null, 2);
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(serverId?: string, operation?: string): PerformanceMetric[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(METRICS_KEY);
  if (!stored) return [];

  try {
    let metrics: PerformanceMetric[] = JSON.parse(stored);

    if (serverId) {
      metrics = metrics.filter(m => m.serverId === serverId);
    }

    if (operation) {
      metrics = metrics.filter(m => m.operation === operation);
    }

    return metrics;
  } catch {
    return [];
  }
}

/**
 * Add a performance metric
 */
export function addPerformanceMetric(
  serverId: string,
  serverName: string,
  operation: string,
  duration: number,
  success: boolean = true,
  error?: string,
  metadata?: unknown
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
    metadata,
  } as PerformanceMetric;

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
export function clearPerformanceMetrics(serverId?: string): void {
  if (typeof window === 'undefined') return;

  if (!serverId) {
    localStorage.removeItem(METRICS_KEY);
    return;
  }

  const metrics = getPerformanceMetrics();
  const filtered = metrics.filter(m => m.serverId !== serverId);
  localStorage.setItem(METRICS_KEY, JSON.stringify(filtered));
}

/**
 * Get average performance for a server
 */
export function getServerPerformanceStats(serverId: string, operation?: string): {
  avgDuration: number;
  successRate: number;
  totalOperations: number;
} | null {
  const metrics = getPerformanceMetrics(serverId, operation);

  if (metrics.length === 0) {
    return null;
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
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const startTime = performance.now();
  let success = true;
  let errorOccurred = false;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    errorOccurred = true;
    success = false;
    throw err;
  } finally {
    const duration = performance.now() - startTime;
    addPerformanceMetric(
      serverId,
      '',
      operation,
      duration,
      success,
      undefined,
      errorOccurred ? { error: true } : undefined
    );
  }
}

/**
 * Log MCP request
 */
export function logMCPRequest(
  serverId: string,
  method: string,
  params?: unknown
): void {
  addDebugLog({
    level: 'debug',
    category: 'mcp',
    message: `MCP Request: ${method}`,
    serverId,
    metadata: { method, params },
  });
}

/**
 * Log MCP response
 */
export function logMCPResponse(
  serverId: string,
  method: string,
  result: unknown,
  duration?: number
): void {
  addDebugLog({
    level: 'debug',
    category: 'mcp',
    message: `MCP Response: ${method}`,
    serverId,
    metadata: { method, result, duration },
  });

  // If duration is provided, also add a performance metric
  if (duration !== undefined) {
    addPerformanceMetric(serverId, '', method, duration, true);
  }
}

/**
 * Log MCP error
 */
export function logMCPError(
  serverId: string,
  method: string,
  error: Error | string,
  context?: unknown
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  addDebugLog({
    level: 'error',
    category: 'mcp',
    message: `MCP Error: ${method}`,
    serverId,
    metadata: {
      method,
      error: error instanceof Error ? error.message : error,
      stack: errorObj.stack,
      context,
    },
  });
}

