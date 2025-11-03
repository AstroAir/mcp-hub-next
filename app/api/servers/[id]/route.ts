/**
 * Individual Server API Route
 * Handles GET, PUT, DELETE operations for specific MCP server configurations
 * Note: This is a client-side managed API - actual storage is in localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import type { 
  GetServerResponse,
  UpdateServerRequest,
  UpdateServerResponse,
  DeleteServerResponse,
  MCPServerConfig 
} from '@/lib/types';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/servers/[id] - Get a specific server configuration
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<GetServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    // This is a placeholder endpoint since actual storage is client-side
    // The client manages servers in localStorage directly
    return NextResponse.json<GetServerResponse>({
      success: true,
      data: undefined,
      message: `Server ${id} endpoint - actual data managed client-side`,
    });
  } catch (error) {
    console.error('Error getting server:', error);
    
    return NextResponse.json<GetServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get server',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/servers/[id] - Update a server configuration
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateServerRequest;
    const { config } = body;

    if (!id) {
      return NextResponse.json<UpdateServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json<UpdateServerResponse>(
        {
          success: false,
          error: 'Server configuration is required',
        },
        { status: 400 }
      );
    }

    // Validate that ID matches
    if (config.id && config.id !== id) {
      return NextResponse.json<UpdateServerResponse>(
        {
          success: false,
          error: 'Server ID mismatch',
        },
        { status: 400 }
      );
    }

    // Create updated config with timestamp
    const updatedConfig: Partial<MCPServerConfig> = {
      ...config,
      id,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<UpdateServerResponse>({
      success: true,
      data: updatedConfig as MCPServerConfig,
      message: 'Server configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating server:', error);
    
    return NextResponse.json<UpdateServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update server',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/servers/[id] - Delete a server configuration
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<DeleteServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    return NextResponse.json<DeleteServerResponse>({
      success: true,
      data: { id },
      message: 'Server configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    
    return NextResponse.json<DeleteServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete server',
      },
      { status: 500 }
    );
  }
}

