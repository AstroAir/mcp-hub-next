import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage, APIResponse } from '@/lib/types';
import { complete } from '@/lib/services/llm-router';

export const dynamic = 'force-dynamic';

interface OptimizeRequest {
  messages: ChatMessage[];
  newMessage: string;
  model: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, newMessage, model } = (await req.json()) as OptimizeRequest;
    if (!newMessage || !model) {
      return NextResponse.json<APIResponse>({ success: false, error: 'Missing newMessage or model' }, { status: 400 });
    }

    const prompt: ChatMessage[] = [
      {
        id: 'sys',
        role: 'system',
        content:
          'You rewrite the user\'s last message into a clear, concise, actionable prompt. Preserve intent, add missing specifics if trivially inferable from context, and remove filler. Output only the rewritten prompt.',
        timestamp: new Date().toISOString(),
      },
      ...messages.slice(-6),
      { id: 'u', role: 'user', content: newMessage, timestamp: new Date().toISOString() },
    ];

    const result = await complete({ model, messages: prompt, options: { maxTokens: 400 } });

    return NextResponse.json<APIResponse<{ optimized: string }>>({ success: true, data: { optimized: result.text || newMessage } });
  } catch (e) {
    console.error('Optimize error:', e);
    return NextResponse.json<APIResponse>({ success: false, error: 'Failed to optimize prompt' }, { status: 500 });
  }
}
