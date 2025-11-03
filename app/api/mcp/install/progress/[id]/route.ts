/**
 * MCP Server Installation Progress API Route
 * Handles retrieving installation progress
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getInstallationProgress,
  cancelInstallation,
  cleanupInstallation,
} from '@/lib/services/mcp-installer';
import type {
  GetInstallProgressResponse,
  CancelInstallResponse,
} from '@/lib/types';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/mcp/install/progress/[id] - Get installation progress
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<GetInstallProgressResponse>(
        {
          success: false,
          error: 'Installation ID is required',
        },
        { status: 400 }
      );
    }

    const progress = getInstallationProgress(id);

    if (!progress) {
      return NextResponse.json<GetInstallProgressResponse>(
        {
          success: false,
          error: `Installation not found: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<GetInstallProgressResponse>({
      success: true,
      data: progress,
      message: 'Installation progress retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting installation progress:', error);

    return NextResponse.json<GetInstallProgressResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installation progress',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcp/install/progress/[id] - Cancel installation
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json<CancelInstallResponse>(
        {
          success: false,
          error: 'Installation ID is required',
        },
        { status: 400 }
      );
    }

    const cancelled = cancelInstallation(id);

    if (!cancelled) {
      return NextResponse.json<CancelInstallResponse>(
        {
          success: false,
          error: `Installation not found or already completed: ${id}`,
        },
        { status: 404 }
      );
    }

    // Cleanup after a delay
    setTimeout(() => {
      cleanupInstallation(id);
    }, 5000);

    return NextResponse.json<CancelInstallResponse>({
      success: true,
      data: { installId: id },
      message: 'Installation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling installation:', error);

    return NextResponse.json<CancelInstallResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel installation',
      },
      { status: 500 }
    );
  }
}

