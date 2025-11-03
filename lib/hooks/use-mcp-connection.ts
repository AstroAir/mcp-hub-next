'use client';

/**
 * useMCPConnection Hook
 * Manages MCP server connections
 */

import { useCallback } from 'react';
import { useConnectionStore } from '@/lib/stores';
import type { MCPServerConfig } from '@/lib/types';

export function useMCPConnection() {
  const { connections, setConnectionState, removeConnection, addHistoryEntry } = useConnectionStore();

  const connect = useCallback(async (config: MCPServerConfig) => {
    // Set connecting status
    setConnectionState(config.id, {
      serverId: config.id,
      status: 'connecting',
      errorCount: 0,
      tools: [],
      resources: [],
      prompts: [],
    });

    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setConnectionState(config.id, data.data);
        
        // Add to history
        addHistoryEntry({
          serverId: config.id,
          serverName: config.name,
          timestamp: new Date().toISOString(),
          success: true,
        });

        return { success: true, data: data.data };
      } else {
        setConnectionState(config.id, {
          serverId: config.id,
          status: 'error',
          lastError: data.error || 'Failed to connect',
          errorCount: 1,
          tools: [],
          resources: [],
          prompts: [],
        });

        addHistoryEntry({
          serverId: config.id,
          serverName: config.name,
          timestamp: new Date().toISOString(),
          success: false,
          error: data.error,
        });

        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setConnectionState(config.id, {
        serverId: config.id,
        status: 'error',
        lastError: errorMessage,
        errorCount: 1,
        tools: [],
        resources: [],
        prompts: [],
      });

      addHistoryEntry({
        serverId: config.id,
        serverName: config.name,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }, [setConnectionState, addHistoryEntry]);

  const disconnect = useCallback(async (serverId: string) => {
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();

      if (data.success) {
        removeConnection(serverId);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [removeConnection]);

  const executeTool = useCallback(async (
    serverId: string,
    toolName: string,
    input: Record<string, unknown>
  ) => {
    try {
      const response = await fetch('/api/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, toolName, input }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  return {
    connections,
    connect,
    disconnect,
    executeTool,
  };
}

