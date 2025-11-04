/**
 * Unified MCP API Route
 * Aggregates MCP operations behind a single endpoint and reports unified status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveClient, getActiveClientIds, getConnectionState, getOrCreateClient, disconnectClient, callTool } from '@/lib/services/mcp-client';
import { getAllProcesses, startServer, stopServer, restartServer } from '@/lib/services/mcp-process-manager';
import type { APIResponse, MCPServerConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UnifiedAction = 'status' | 'connect' | 'disconnect' | 'executeTool' | 'start' | 'stop' | 'restart';

interface UnifiedRequestBody {
  action: UnifiedAction;
  // For connect/start/restart
  config?: MCPServerConfig;
  // For server-specific actions
  serverId?: string;
  // For tool execution
  toolName?: string;
  input?: Record<string, unknown>;
}

type UnifiedStatus = {
  activeClientIds: string[];
  connections: Record<string, Awaited<ReturnType<typeof getConnectionState>> | { serverId: string; status: 'disconnected' } >;
  processes: ReturnType<typeof getAllProcesses>;
};

function ok<T>(data: T, message?: string) {
  return NextResponse.json<APIResponse<T>>({ success: true, data, message });
}

function fail(message: string, status = 400) {
  return NextResponse.json<APIResponse>({ success: false, error: message }, { status });
}

async function buildStatus(): Promise<UnifiedStatus> {
  const activeIds = getActiveClientIds();
  const processes = getAllProcesses();

  const connections: UnifiedStatus['connections'] = {};
  for (const id of activeIds) {
    const client = getActiveClient(id);
    if (!client) {
      connections[id] = { serverId: id, status: 'disconnected' };
      continue;
    }
    try {
      // We don't have server names on the server; use ID as a placeholder.
      connections[id] = await getConnectionState(id, id, client);
    } catch {
      connections[id] = { serverId: id, status: 'disconnected', errorCount: 0, tools: [], resources: [], prompts: [] };
    }
  }

  return { activeClientIds: activeIds, connections, processes };
}

export async function GET() {
  try {
    const status = await buildStatus();
    return ok(status);
  } catch (error) {
    console.error('Unified MCP GET error:', error);
    return fail(error instanceof Error ? error.message : 'Failed to build MCP status', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UnifiedRequestBody;
    const { action } = body;

    switch (action) {
      case 'status': {
        const status = await buildStatus();
        return ok(status);
      }
      case 'connect': {
        if (!body.config) return fail('config is required for connect');
        const client = await getOrCreateClient(body.config);
        const state = await getConnectionState(body.config.id, body.config.name, client);
        return ok(state, 'Connected');
      }
      case 'disconnect': {
        if (!body.serverId) return fail('serverId is required for disconnect');
        await disconnectClient(body.serverId);
        return ok({ serverId: body.serverId }, 'Disconnected');
      }
      case 'executeTool': {
        const { serverId, toolName, input } = body;
        if (!serverId || !toolName) return fail('serverId and toolName are required');
        const output = await callTool(serverId, toolName, input || {});
        return ok({ toolName, input: input || {}, output, timestamp: new Date().toISOString() }, 'Tool executed');
      }
      case 'start': {
        const { serverId, config } = body;
        if (!serverId || !config) return fail('serverId and config are required for start');
        const proc = await startServer(serverId, config);
        return ok(proc, 'Server started');
      }
      case 'stop': {
        const { serverId } = body;
        if (!serverId) return fail('serverId is required for stop');
        await stopServer(serverId, { force: false });
        return ok({ serverId }, 'Server stopped');
      }
      case 'restart': {
        const { serverId, config } = body;
        if (!serverId) return fail('serverId is required for restart');
        const proc = await restartServer(serverId, config);
        return ok(proc, 'Server restarted');
      }
      default:
        return fail(`Unknown action: ${String(action)}`);
    }
  } catch (error) {
    console.error('Unified MCP POST error:', error);
    return fail(error instanceof Error ? error.message : 'Unified MCP request failed', 500);
  }
}
