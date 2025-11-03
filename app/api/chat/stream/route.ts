/**
 * Streaming Chat API Route
 * Handles streaming chat responses from Claude using Server-Sent Events
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callTool, getActiveClient } from '@/lib/services/mcp-client';
import type { ChatRequest } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { messages, model = 'claude-3-5-sonnet-20241022', connectedServers } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get available tools from connected servers
    const tools: Anthropic.Tool[] = [];
    const serverToolMap: Record<string, string> = {};

    if (connectedServers && connectedServers.length > 0) {
      for (const serverId of connectedServers) {
        try {
          const client = getActiveClient(serverId);
          if (!client) {
            console.warn(`Client not found for server ${serverId}`);
            continue;
          }
          const toolsResult = await client.listTools();
          
          toolsResult.tools.forEach((tool) => {
            tools.push({
              name: tool.name,
              description: tool.description || '',
              input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
            });
            serverToolMap[tool.name] = serverId;
          });
        } catch (error) {
          console.error(`Failed to get tools from server ${serverId}:`, error);
        }
      }
    }

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Convert messages to Anthropic format
          const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));

          // Create streaming request
          const streamResponse = await anthropic.messages.create({
            model,
            max_tokens: 4096,
            messages: anthropicMessages,
            tools: tools.length > 0 ? tools : undefined,
            stream: true,
          });

          let currentToolUse: { id: string; name: string; input: string } | null = null;

          // Process stream events
          for await (const event of streamResponse) {
            // Send event to client
            const data = JSON.stringify({ type: event.type, data: event });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // Handle different event types
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                currentToolUse = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: '',
                };
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'input_json_delta') {
                if (currentToolUse) {
                  currentToolUse.input += event.delta.partial_json;
                }
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolUse) {
                // Execute tool call
                try {
                  const serverId = serverToolMap[currentToolUse.name];
                  if (serverId) {
                    const toolInput = JSON.parse(currentToolUse.input);
                    const result = await callTool(serverId, currentToolUse.name, toolInput) as { content: unknown; };
                    
                    // Send tool result
                    const toolResultData = JSON.stringify({
                      type: 'tool_result',
                      data: {
                        tool_use_id: currentToolUse.id,
                        content: result.content,
                      },
                    });
                    controller.enqueue(encoder.encode(`data: ${toolResultData}\n\n`));
                  }
                } catch (error) {
                  console.error('Tool execution error:', error);
                  const errorData = JSON.stringify({
                    type: 'tool_error',
                    data: {
                      tool_use_id: currentToolUse.id,
                      error: error instanceof Error ? error.message : 'Tool execution failed',
                    },
                  });
                  controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                }
                currentToolUse = null;
              }
            } else if (event.type === 'message_stop') {
              // Send completion event
              const completeData = JSON.stringify({ type: 'complete', data: {} });
              controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            }
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            data: {
              error: error instanceof Error ? error.message : 'Streaming failed',
            },
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
      cancel() {
        // Handle client disconnect
        console.log('Stream cancelled by client');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process chat request',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

