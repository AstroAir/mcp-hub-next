/**
 * MCP Server Lifecycle Management API Route
 * Handles start, stop, restart operations for MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startServer,
  stopServer,
  restartServer,
  getAllProcesses,
} from '@/lib/services/mcp-process-manager';
import type {
  MCPServerConfig,
  StartServerRequest,
  StartServerResponse,
  StopServerRequest,
  StopServerResponse,
  RestartServerRequest,
  RestartServerResponse,
  ListRunningServersResponse,
} from '@/lib/types';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/lifecycle - Start a server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as StartServerRequest;
    const { serverId, config } = body;

    if (!serverId) {
      return NextResponse.json<StartServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    // Get server configuration
    // Note: In a real implementation, you'd fetch this from a database
    // For now, we'll require the config to be passed in the request
    if (!config) {
      return NextResponse.json<StartServerResponse>(
        {
          success: false,
          error: 'Server configuration is required',
        },
        { status: 400 }
      );
    }

    // Start the server
    const processState = await startServer(serverId, config as MCPServerConfig);

    return NextResponse.json<StartServerResponse>({
      success: true,
      data: processState,
      message: 'Server started successfully',
    });
  } catch (error) {
    console.error('Error starting server:', error);

    return NextResponse.json<StartServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start server',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcp/lifecycle - Stop a server
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as StopServerRequest;
  const { serverId, force } = body;

    if (!serverId) {
      return NextResponse.json<StopServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

  // Stop the server
  await stopServer(serverId, { force });

    return NextResponse.json<StopServerResponse>({
      success: true,
      data: { serverId },
      message: 'Server stopped successfully',
    });
  } catch (error) {
    console.error('Error stopping server:', error);

    return NextResponse.json<StopServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop server',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mcp/lifecycle - Restart a server
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as RestartServerRequest;
    const { serverId, config } = body;

    if (!serverId) {
      return NextResponse.json<RestartServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    // Restart the server
    const processState = await restartServer(serverId, config as MCPServerConfig | undefined);

    return NextResponse.json<RestartServerResponse>({
      success: true,
      data: processState,
      message: 'Server restarted successfully',
    });
  } catch (error) {
    console.error('Error restarting server:', error);

    return NextResponse.json<RestartServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restart server',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/lifecycle - List all running servers
 */
export async function GET() {
  try {
    const processes = getAllProcesses();

    return NextResponse.json<ListRunningServersResponse>({
      success: true,
      data: Object.values(processes),
      message: 'Running servers retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing running servers:', error);

    return NextResponse.json<ListRunningServersResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list running servers',
      },
      { status: 500 }
    );
  }
}

