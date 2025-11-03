/**
 * MCP Server Status API Route
 * Handles retrieving server process status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProcessState } from '@/lib/services/mcp-process-manager';
import type { GetServerStatusResponse } from '@/lib/types';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/mcp/lifecycle/status/[id] - Get server status
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<GetServerStatusResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    const processState = getProcessState(id);

    if (!processState) {
      return NextResponse.json<GetServerStatusResponse>(
        {
          success: false,
          error: `No process found for server: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<GetServerStatusResponse>({
      success: true,
      data: processState,
      message: 'Server status retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting server status:', error);

    return NextResponse.json<GetServerStatusResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get server status',
      },
      { status: 500 }
    );
  }
}

