/**
 * MCP Server Installation API Route
 * Handles installation of MCP servers from various sources
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  installServer,
  validateInstallation,
} from '@/lib/services/mcp-installer';
import type {
  InstallServerRequest,
  InstallServerResponse,
  ValidateInstallRequest,
  ValidateInstallResponse,
} from '@/lib/types';

/**
 * POST /api/mcp/install - Install a new MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InstallServerRequest;
    const { config, serverName, serverDescription } = body;

    if (!config) {
      return NextResponse.json<InstallServerResponse>(
        {
          success: false,
          error: 'Installation configuration is required',
        },
        { status: 400 }
      );
    }

    if (!serverName) {
      return NextResponse.json<InstallServerResponse>(
        {
          success: false,
          error: 'Server name is required',
        },
        { status: 400 }
      );
    }

    // Validate configuration
    const validation = await validateInstallation(config);
    if (!validation.valid) {
      return NextResponse.json<InstallServerResponse>(
        {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Start installation
    const result = await installServer(config, serverName, serverDescription);

    return NextResponse.json<InstallServerResponse>({
      success: true,
      data: result,
      message: 'Installation started successfully',
    });
  } catch (error) {
    console.error('Error installing server:', error);

    return NextResponse.json<InstallServerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install server',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mcp/install - Validate installation configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as ValidateInstallRequest;
    const { config } = body;

    if (!config) {
      return NextResponse.json<ValidateInstallResponse>(
        {
          success: false,
          error: 'Installation configuration is required',
        },
        { status: 400 }
      );
    }

    // Validate configuration
    const validation = await validateInstallation(config);

    return NextResponse.json<ValidateInstallResponse>({
      success: true,
      data: validation,
      message: validation.valid 
        ? 'Configuration is valid' 
        : 'Configuration has errors',
    });
  } catch (error) {
    console.error('Error validating installation:', error);

    return NextResponse.json<ValidateInstallResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate configuration',
      },
      { status: 500 }
    );
  }
}

