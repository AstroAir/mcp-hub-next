/**
 * Marketplace API Route
 * Proxies requests to Cline's marketplace API with proper headers
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MarketplaceMCPServer } from '@/lib/types';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const MARKETPLACE_API_URL = 'https://api.cline.bot/v1/mcp/marketplace';

/**
 * GET /api/marketplace - Fetch marketplace servers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Fetch from Cline's API
    const response = await fetch(MARKETPLACE_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'cline-vscode-extension',
        'Content-Type': 'application/json',
      },
      // Add cache control based on forceRefresh
      cache: forceRefresh ? 'no-store' : 'default',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch marketplace data: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate that we received an array
    if (!Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid marketplace data format: expected array',
        },
        { status: 500 }
      );
    }

    const servers = data as MarketplaceMCPServer[];

    return NextResponse.json({
      success: true,
      data: servers,
      message: 'Marketplace servers fetched successfully',
      count: servers.length,
    });
  } catch (error) {
    console.error('Error fetching marketplace data:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch marketplace data',
      },
      { status: 500 }
    );
  }
}

