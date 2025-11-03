/**
 * MCP Connect API Route
 * Handles connecting to MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateClient, 
  getConnectionState 
} from '@/lib/services/mcp-client';
import type { 
  ConnectServerRequest, 
  ConnectServerResponse,
  MCPServerConfig 
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ConnectServerRequest & {
      config: MCPServerConfig;
      oauthToken?: string;
    };
    const { config, oauthToken } = body;

    if (!config) {
      return NextResponse.json<ConnectServerResponse>(
        {
          success: false,
          error: 'Server configuration is required',
        },
        { status: 400 }
      );
    }

    // If OAuth token is provided, add it to headers
    if (oauthToken && (config.transportType === 'http' || config.transportType === 'sse')) {
      const httpConfig = config as { headers?: Record<string, string> };
      httpConfig.headers = {
        ...httpConfig.headers,
        'Authorization': `Bearer ${oauthToken}`,
      };
    }

    // Create or get existing client
    const client = await getOrCreateClient(config);

    // Get connection state
    const connectionState = await getConnectionState(config.id, config.name, client);

    return NextResponse.json<ConnectServerResponse>({
      success: true,
      data: connectionState,
      message: 'Successfully connected to MCP server',
    });
  } catch (error) {
    console.error('Error connecting to MCP server:', error);

    return NextResponse.json<ConnectServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MCP server',
      },
      { status: 500 }
    );
  }
}

