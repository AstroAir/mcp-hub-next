/**
 * MCP Server Registry API Route
 * Handles server discovery and registry operations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchRegistry,
  getCategories,
  getPopularServers,
  refreshCache,
} from '@/lib/services/mcp-registry';
import type {
  SearchRegistryRequest,
  SearchRegistryResponse,
  ListRegistryCategoriesResponse,
  GetPopularServersResponse,
} from '@/lib/types';

/**
 * POST /api/mcp/registry - Search registry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchRegistryRequest;
    const { filters } = body;

    if (!filters) {
      return NextResponse.json<SearchRegistryResponse>(
        {
          success: false,
          error: 'Search filters are required',
        },
        { status: 400 }
      );
    }

    const result = await searchRegistry(filters);

    return NextResponse.json<SearchRegistryResponse>({
      success: true,
      data: result,
      message: 'Registry search completed successfully',
    });
  } catch (error) {
    console.error('Error searching registry:', error);

    return NextResponse.json<SearchRegistryResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search registry',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/registry - Get categories or popular servers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'categories') {
      const categories = await getCategories();

      return NextResponse.json<ListRegistryCategoriesResponse>({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully',
      });
    }

    if (action === 'popular') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const source = searchParams.get('source') as 'npm' | 'github' | undefined;

      const servers = await getPopularServers(limit, source);

      return NextResponse.json<GetPopularServersResponse>({
        success: true,
        data: servers,
        message: 'Popular servers retrieved successfully',
      });
    }

    if (action === 'refresh') {
      await refreshCache();

      return NextResponse.json({
        success: true,
        message: 'Registry cache refreshed successfully',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use: categories, popular, or refresh',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in registry GET:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

