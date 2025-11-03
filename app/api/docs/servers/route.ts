/**
 * MCP Server Documentation API
 * Provides documentation for MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllServerDocs,
  getServerDoc,
  getServersByCategory,
  getCategories,
  searchServerDocs,
  type MCPServerDoc,
} from '@/lib/data/mcp-server-docs';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

interface DocsResponse {
  success: boolean;
  data?: MCPServerDoc[] | MCPServerDoc | string[];
  error?: string;
}

/**
 * GET /api/docs/servers - Get server documentation
 * Query params:
 * - id: Get specific server doc
 * - category: Get servers by category
 * - search: Search servers
 * - categories: Get all categories (boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const categories = searchParams.get('categories');

    // Get all categories
    if (categories === 'true') {
      return NextResponse.json<DocsResponse>({
        success: true,
        data: getCategories(),
      });
    }

    // Get specific server doc
    if (id) {
      const doc = getServerDoc(id);
      if (!doc) {
        return NextResponse.json<DocsResponse>(
          {
            success: false,
            error: `Server documentation not found: ${id}`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json<DocsResponse>({
        success: true,
        data: doc,
      });
    }

    // Search servers
    if (search) {
      const results = searchServerDocs(search);
      return NextResponse.json<DocsResponse>({
        success: true,
        data: results,
      });
    }

    // Get servers by category
    if (category) {
      const servers = getServersByCategory(category);
      return NextResponse.json<DocsResponse>({
        success: true,
        data: servers,
      });
    }

    // Get all server docs
    const allDocs = getAllServerDocs();
    return NextResponse.json<DocsResponse>({
      success: true,
      data: allDocs,
    });
  } catch (error) {
    console.error('Error fetching server documentation:', error);

    return NextResponse.json<DocsResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documentation',
      },
      { status: 500 }
    );
  }
}

