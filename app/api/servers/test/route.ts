/**
 * Server Test API Route
 * Tests connection to an MCP server without persisting it
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createStdioClient,
  createSSEClient,
  createHTTPClient,
  getConnectionState,
  disconnectClient
} from '@/lib/services/mcp-client';
import type {
  TestServerRequest,
  TestServerResponse,
  MCPServerTestResult,
  MCPServerConfig,
  StdioMCPServerConfig,
  SSEMCPServerConfig,
  HTTPMCPServerConfig
} from '@/lib/types';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const tempId = `test-${nanoid()}`;
  
  try {
    const body = await request.json() as TestServerRequest;
    const { config } = body;

    if (!config) {
      return NextResponse.json<TestServerResponse>(
        {
          success: false,
          error: 'Server configuration is required',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Create temporary config with test ID
    const testConfig: MCPServerConfig = {
      ...config,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MCPServerConfig;

    // Create client based on transport type
    let client;

    switch (testConfig.transportType) {
      case 'stdio':
        client = await createStdioClient(testConfig as StdioMCPServerConfig);
        break;
      case 'sse':
        client = await createSSEClient(testConfig as SSEMCPServerConfig);
        break;
      case 'http':
        client = await createHTTPClient(testConfig as HTTPMCPServerConfig);
        break;
      default:
        return NextResponse.json<TestServerResponse>(
          {
            success: false,
            error: `Unknown transport type: ${(testConfig as MCPServerConfig).transportType}`,
          },
          { status: 400 }
        );
    }

    // Get connection state
    const connectionState = await getConnectionState(tempId, testConfig.name, client);
    
    const latency = Date.now() - startTime;

    // Disconnect immediately
    await disconnectClient(tempId);

    const testResult: MCPServerTestResult = {
      success: connectionState.status === 'connected',
      message: connectionState.status === 'connected' 
        ? 'Successfully connected to server' 
        : connectionState.lastError || 'Connection failed',
      tools: connectionState.tools,
      resources: connectionState.resources,
      prompts: connectionState.prompts,
      latency,
    };

    return NextResponse.json<TestServerResponse>({
      success: true,
      data: testResult,
      message: 'Server test completed',
    });
  } catch (error) {
    console.error('Error testing server:', error);
    
    // Clean up on error
    try {
      await disconnectClient(tempId);
    } catch {
      // Ignore cleanup errors
    }

    const testResult: MCPServerTestResult = {
      success: false,
      message: 'Failed to connect to server',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json<TestServerResponse>(
      {
        success: false,
        data: testResult,
        error: error instanceof Error ? error.message : 'Failed to test server',
      },
      { status: 500 }
    );
  }
}

