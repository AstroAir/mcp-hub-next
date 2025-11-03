/**
 * MCP Disconnect API Route
 * Handles disconnecting from MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { disconnectClient } from '@/lib/services/mcp-client';
import type { 
  DisconnectServerRequest, 
  DisconnectServerResponse 
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DisconnectServerRequest;
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json<DisconnectServerResponse>(
        {
          success: false,
          error: 'Server ID is required',
        },
        { status: 400 }
      );
    }

    await disconnectClient(serverId);

    return NextResponse.json<DisconnectServerResponse>({
      success: true,
      data: { serverId },
      message: 'Successfully disconnected from MCP server',
    });
  } catch (error) {
    console.error('Error disconnecting from MCP server:', error);
    
    return NextResponse.json<DisconnectServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect from MCP server',
      },
      { status: 500 }
    );
  }
}

