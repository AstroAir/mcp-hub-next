/**
 * MCP Server Registry Individual Server API Route
 * Handles retrieving individual server information from registry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerById } from '@/lib/services/mcp-registry';
import type { GetRegistryServerResponse } from '@/lib/types';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/mcp/registry/[id] - Get server by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<GetRegistryServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    // Decode the ID (it might be URL encoded)
    const decodedId = decodeURIComponent(id);
    
    const server = await getServerById(decodedId);

    if (!server) {
      return NextResponse.json<GetRegistryServerResponse>(
        {
          success: false,
          error: `Server not found: ${decodedId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<GetRegistryServerResponse>({
      success: true,
      data: server,
      message: 'Server retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting registry server:', error);

    return NextResponse.json<GetRegistryServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get server',
      },
      { status: 500 }
    );
  }
}

