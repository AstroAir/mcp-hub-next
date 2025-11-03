/**
 * Chat API Route
 * Handles chat with Claude and MCP tool integration
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callTool, getActiveClient } from '@/lib/services/mcp-client';
import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  MCPToolCallResult
} from '@/lib/types';
import { nanoid } from 'nanoid';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { messages, model, connectedServers } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: 'Messages are required',
        },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: 'Anthropic API key is not configured',
        },
        { status: 500 }
      );
    }

    // Get available tools from connected servers
    const tools: Anthropic.Tool[] = [];
    const serverToolMap = new Map<string, string>(); // toolName -> serverId

    if (connectedServers && connectedServers.length > 0) {
      // Fetch tools from each connected server
      for (const serverId of connectedServers) {
        try {
          const client = getActiveClient(serverId);
          if (!client) {
            console.warn();
            continue;
          }
          const toolsResult = await client.listTools();

          // Convert MCP tools to Anthropic format
          for (const tool of toolsResult.tools) {
            tools.push({
              name: tool.name,
              description: tool.description || `Tool from server ${serverId}`,
              input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
            });

            // Map tool name to server ID for execution
            serverToolMap.set(tool.name, serverId);
          }
        } catch (error) {
          console.error(`Failed to fetch tools from server ${serverId}:`, error);
          // Continue with other servers
        }
      }
    }

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    // Call Claude
    const response = await anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: anthropicMessages,
      tools: tools.length > 0 ? tools : undefined,
    });

    // Handle tool calls if any
    const toolCalls: MCPToolCallResult[] = [];
    
    if (response.stop_reason === 'tool_use') {
      // Extract tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute each tool
      for (const toolUse of toolUseBlocks) {
        try {
          // Find which server has this tool
          const serverId = serverToolMap.get(toolUse.name);

          if (!serverId) {
            throw new Error(`No server found for tool: ${toolUse.name}`);
          }

          const result = await callTool(
            serverId,
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );

          toolCalls.push({
            toolName: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
            output: result,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          toolCalls.push({
            toolName: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Extract text content
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const assistantMessage: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: textContent || 'I used tools to help with your request.',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json<ChatResponse>({
      success: true,
      data: {
        message: assistantMessage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      },
      message: 'Chat completed successfully',
    });
  } catch (error) {
    console.error('Error in chat:', error);
    
    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat',
      },
      { status: 500 }
    );
  }
}

