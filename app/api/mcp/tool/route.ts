/**
 * MCP Tool Execution API Route
 * Handles executing tools on MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { callTool } from '@/lib/services/mcp-client';
import type {
  ExecuteToolRequest,
  ExecuteToolResponse,
  MCPToolCallResult
} from '@/lib/types';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExecuteToolRequest;
    const { serverId, toolName, input } = body;

    if (!serverId || !toolName) {
      return NextResponse.json<ExecuteToolResponse>(
        {
          success: false,
          error: 'Server ID and tool name are required',
        },
        { status: 400 }
      );
    }

    const result = await callTool(serverId, toolName, input || {});

    const toolCallResult: MCPToolCallResult = {
      toolName,
      input: input || {},
      output: result,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json<ExecuteToolResponse>({
      success: true,
      data: toolCallResult,
      message: 'Tool executed successfully',
    });
  } catch (error) {
    console.error('Error executing tool:', error);
    
    const errorResult: MCPToolCallResult = {
      toolName: (await request.json()).toolName || 'unknown',
      input: (await request.json()).input || {},
      output: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json<ExecuteToolResponse>(
      {
        success: false,
        data: errorResult,
        error: error instanceof Error ? error.message : 'Failed to execute tool',
      },
      { status: 500 }
    );
  }
}

