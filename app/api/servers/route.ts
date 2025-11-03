/**
 * Servers API Route
 * Handles CRUD operations for MCP server configurations
 * Note: This is a client-side managed API - actual storage is in localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import type {
  CreateServerRequest,
  CreateServerResponse,
  ListServersResponse,
  MCPServerConfig
} from '@/lib/types';

/**
 * POST /api/servers - Create a new server configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateServerRequest;
    const { config } = body;

    if (!config) {
      return NextResponse.json<CreateServerResponse>(
        {
          success: false,
          error: 'Server configuration is required',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!config.name || !config.transportType) {
      return NextResponse.json<CreateServerResponse>(
        {
          success: false,
          error: 'Server name and transport type are required',
        },
        { status: 400 }
      );
    }

    // Create full server config with generated ID and timestamps
    const now = new Date().toISOString();
    const serverConfig: MCPServerConfig = {
      ...config,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    } as MCPServerConfig;

    return NextResponse.json<CreateServerResponse>({
      success: true,
      data: serverConfig,
      message: 'Server configuration created successfully',
    });
  } catch (error) {
    console.error('Error creating server:', error);
    
    return NextResponse.json<CreateServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create server',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/servers - List all server configurations
 * Note: Since storage is client-side, this endpoint returns an empty array
 * Actual server list is managed in localStorage by the client
 */
export async function GET() {
  try {
    // This is a placeholder endpoint since actual storage is client-side
    // The client manages servers in localStorage directly
    return NextResponse.json<ListServersResponse>({
      success: true,
      data: [],
      message: 'Server list endpoint - actual data managed client-side',
    });
  } catch (error) {
    console.error('Error listing servers:', error);

    return NextResponse.json<ListServersResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list servers',
      },
      { status: 500 }
    );
  }
}
