/**
 * MCP Server Installation Service
 * Handles installation of MCP servers from npm, GitHub, and local paths
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { access, stat } from 'fs/promises';
import { join, resolve, normalize } from 'path';
import { nanoid } from 'nanoid';
import type {
  InstallConfig,
  NPMInstallConfig,
  GitHubInstallConfig,
  LocalInstallConfig,
  InstallationProgress,
  InstallationValidation,
} from '@/lib/types';

const execAsync = promisify(exec);

/**
 * Active installations map
 */
const activeInstallations = new Map<string, InstallationProgress>();

/**
 * Installation base directory
 */
const INSTALL_BASE_DIR = process.env.MCP_INSTALL_DIR || join(process.cwd(), '.mcp-servers');

/**
 * Allowed installation directories for local paths
 */
const ALLOWED_LOCAL_DIRS = [
  process.cwd(),
  join(process.cwd(), 'mcp-servers'),
  INSTALL_BASE_DIR,
];

/**
 * Sanitize command arguments to prevent injection
 */
function sanitizeArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Remove null bytes and newlines first
    let cleaned = arg.replace(/[\0\n\r]/g, '');

    // For URLs (registry arguments), validate as proper URL
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      try {
        const url = new URL(cleaned);
        // Only allow http and https protocols
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('Invalid URL protocol');
        }
        return url.toString();
      } catch {
        throw new Error(`Invalid URL argument: ${cleaned}`);
      }
    }

    // Remove shell metacharacters
    cleaned = cleaned.replace(/[;&|`$(){}[\]<>]/g, '');

    // For other arguments, ensure only safe characters
    if (!/^[@a-zA-Z0-9._\/-]+$/.test(cleaned)) {
      throw new Error(`Invalid argument format: ${cleaned}`);
    }

    return cleaned;
  });
}

/**
 * Validate path is within allowed directories
 */
function isPathAllowed(targetPath: string): boolean {
  const normalizedPath = normalize(resolve(targetPath));
  
  return ALLOWED_LOCAL_DIRS.some((allowedDir) => {
    const normalizedAllowed = normalize(resolve(allowedDir));
    return normalizedPath.startsWith(normalizedAllowed);
  });
}

/**
 * Update installation progress
 */
function updateProgress(
  installId: string,
  updates: Partial<InstallationProgress>
): InstallationProgress {
  const current = activeInstallations.get(installId);
  if (!current) {
    throw new Error(`Installation not found: ${installId}`);
  }

  const updated: InstallationProgress = {
    ...current,
    ...updates,
  };

  activeInstallations.set(installId, updated);
  return updated;
}

/**
 * Validate npm package name
 */
function validateNPMPackage(packageName: string): { valid: boolean; error?: string } {
  // Check for valid npm package name format
  const npmPackageRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  
  if (!npmPackageRegex.test(packageName)) {
    return {
      valid: false,
      error: 'Invalid npm package name format',
    };
  }

  // Check for suspicious patterns
  if (packageName.includes('..') || packageName.includes('/')) {
    return {
      valid: false,
      error: 'Package name contains invalid characters',
    };
  }

  return { valid: true };
}

/**
 * Validate GitHub repository format
 */
function validateGitHubRepo(repository: string): { valid: boolean; error?: string } {
  // Format: owner/repo
  const githubRepoRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
  
  if (!githubRepoRegex.test(repository)) {
    return {
      valid: false,
      error: 'Invalid GitHub repository format. Expected: owner/repo',
    };
  }

  return { valid: true };
}

/**
 * Validate local path
 */
async function validateLocalPath(path: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if path is allowed
    if (!isPathAllowed(path)) {
      return {
        valid: false,
        error: 'Path is outside allowed directories',
      };
    }

    // Check if path exists
    await access(path);

    // Check if it's a directory
    const stats = await stat(path);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        error: 'Path must be a directory',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Path validation failed',
    };
  }
}

/**
 * Check if npm is available
 */
async function checkNPMAvailable(): Promise<boolean> {
  try {
    await execAsync('npm --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if git is available
 */
async function checkGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate installation configuration
 */
export async function validateInstallation(
  config: InstallConfig
): Promise<InstallationValidation> {
  const result: InstallationValidation = {
    valid: true,
    errors: [],
    warnings: [],
    dependencies: [],
  };

  switch (config.source) {
    case 'npm': {
      const npmConfig = config as NPMInstallConfig;
      
      // Validate package name
      const packageValidation = validateNPMPackage(npmConfig.packageName);
      if (!packageValidation.valid) {
        result.valid = false;
        result.errors.push(packageValidation.error || 'Invalid package name');
      }

      // Check npm availability
      const npmAvailable = await checkNPMAvailable();
      if (!npmAvailable) {
        result.valid = false;
        result.errors.push('npm is not installed or not available in PATH');
      } else {
        result.dependencies.push({
          name: 'npm',
          required: true,
          installed: true,
        });
      }

      // Estimate size and time
      result.estimatedSize = 10 * 1024 * 1024; // 10MB estimate
      result.estimatedTime = 30; // 30 seconds estimate
      break;
    }

    case 'github': {
      const githubConfig = config as GitHubInstallConfig;
      
      // Validate repository format
      const repoValidation = validateGitHubRepo(githubConfig.repository);
      if (!repoValidation.valid) {
        result.valid = false;
        result.errors.push(repoValidation.error || 'Invalid repository format');
      }

      // Check git availability
      const gitAvailable = await checkGitAvailable();
      if (!gitAvailable) {
        result.valid = false;
        result.errors.push('git is not installed or not available in PATH');
      } else {
        result.dependencies.push({
          name: 'git',
          required: true,
          installed: true,
        });
      }

      // Estimate size and time
      result.estimatedSize = 50 * 1024 * 1024; // 50MB estimate
      result.estimatedTime = 60; // 60 seconds estimate
      break;
    }

    case 'local': {
      const localConfig = config as LocalInstallConfig;
      
      // Validate path
      const pathValidation = await validateLocalPath(localConfig.path);
      if (!pathValidation.valid) {
        result.valid = false;
        result.errors.push(pathValidation.error || 'Invalid path');
      }

      // Estimate size (instant for local)
      result.estimatedSize = 0;
      result.estimatedTime = 1;
      break;
    }
  }

  return result;
}

/**
 * Get installation progress
 */
export function getInstallationProgress(installId: string): InstallationProgress | undefined {
  return activeInstallations.get(installId);
}

/**
 * Cancel installation
 */
export function cancelInstallation(installId: string): boolean {
  const installation = activeInstallations.get(installId);
  if (!installation) {
    return false;
  }

  updateProgress(installId, {
    status: 'cancelled',
    message: 'Installation cancelled by user',
    completedAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Clean up completed installations
 */
export function cleanupInstallation(installId: string): void {
  activeInstallations.delete(installId);
}

/**
 * Install npm package
 */
export async function installNPMPackage(
  config: NPMInstallConfig
): Promise<{ installId: string; progress: InstallationProgress }> {
  const installId = nanoid();
  const installDir = join(INSTALL_BASE_DIR, 'npm', config.packageName.replace(/\//g, '-'));

  // Initialize progress
  const progress: InstallationProgress = {
    installId,
    status: 'pending',
    progress: 0,
    message: 'Preparing npm installation...',
    startedAt: new Date().toISOString(),
    logs: [],
  };

  activeInstallations.set(installId, progress);

  // Start installation in background
  (async () => {
    try {
      // Update to downloading
      updateProgress(installId, {
        status: 'downloading',
        progress: 10,
        message: `Downloading ${config.packageName}...`,
        currentStep: 'Downloading package',
        totalSteps: 3,
        currentStepNumber: 1,
      });

      // Build npm install command
      const packageSpec = config.version
        ? `${config.packageName}@${config.version}`
        : config.packageName;

      const args = ['install', packageSpec];

      if (!config.global) {
        args.push('--prefix', installDir);
      }

      if (config.registry) {
        args.push('--registry', config.registry);
      }

      // Sanitize arguments
      const sanitizedArgs = sanitizeArgs(args);

      // Execute npm install
      const npmProcess = spawn('npm', sanitizedArgs, {
        cwd: INSTALL_BASE_DIR,
        env: process.env,
      });

      npmProcess.stdout?.on('data', (data) => {
        const output = data.toString();

        updateProgress(installId, {
          progress: 50,
          logs: [...(activeInstallations.get(installId)?.logs || []), output],
        });
      });

      npmProcess.stderr?.on('data', (data) => {
        const output = data.toString();

        updateProgress(installId, {
          logs: [...(activeInstallations.get(installId)?.logs || []), output],
        });
      });

      await new Promise<void>((resolve, reject) => {
        npmProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });

        npmProcess.on('error', (error) => {
          reject(error);
        });
      });

      // Update to configuring
      updateProgress(installId, {
        status: 'configuring',
        progress: 80,
        message: 'Configuring server...',
        currentStep: 'Configuring',
        currentStepNumber: 2,
      });

      // Get installed version
      let version = config.version;
      if (!version) {
        try {
          const { stdout } = await execAsync(`npm list ${config.packageName} --json`, {
            cwd: installDir,
          });
          const packageInfo = JSON.parse(stdout);
          version = packageInfo.dependencies?.[config.packageName]?.version;
        } catch {
          // Ignore version detection errors
        }
      }

      // Complete installation
      updateProgress(installId, {
        status: 'completed',
        progress: 100,
        message: 'Installation completed successfully',
        currentStep: 'Completed',
        currentStepNumber: 3,
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      updateProgress(installId, {
        status: 'failed',
        progress: 0,
        message: 'Installation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      });
    }
  })();

  return { installId, progress };
}

/**
 * Install from GitHub repository
 */
export async function installGitHubRepo(
  config: GitHubInstallConfig
): Promise<{ installId: string; progress: InstallationProgress }> {
  const installId = nanoid();
  const repoName = config.repository.split('/')[1];
  const installDir = join(INSTALL_BASE_DIR, 'github', repoName);

  // Initialize progress
  const progress: InstallationProgress = {
    installId,
    status: 'pending',
    progress: 0,
    message: 'Preparing GitHub installation...',
    startedAt: new Date().toISOString(),
    logs: [],
  };

  activeInstallations.set(installId, progress);

  // Start installation in background
  (async () => {
    try {
      // Update to downloading
      updateProgress(installId, {
        status: 'downloading',
        progress: 10,
        message: `Cloning ${config.repository}...`,
        currentStep: 'Cloning repository',
        totalSteps: 4,
        currentStepNumber: 1,
      });

      // Build git clone URL
      const gitUrl = `https://github.com/${config.repository}.git`;
      const args = ['clone', gitUrl, installDir];

      if (config.branch) {
        args.push('--branch', config.branch);
      }

      if (config.tag) {
        args.push('--branch', config.tag);
      }

      args.push('--depth', '1'); // Shallow clone

      // Sanitize arguments
      const sanitizedArgs = sanitizeArgs(args);

      // Execute git clone
      const gitProcess = spawn('git', sanitizedArgs, {
        cwd: INSTALL_BASE_DIR,
        env: process.env,
      });

      gitProcess.stdout?.on('data', (data) => {
        const output = data.toString();

        updateProgress(installId, {
          progress: 40,
          logs: [...(activeInstallations.get(installId)?.logs || []), output],
        });
      });

      gitProcess.stderr?.on('data', (data) => {
        const output = data.toString();

        updateProgress(installId, {
          logs: [...(activeInstallations.get(installId)?.logs || []), output],
        });
      });

      await new Promise<void>((resolve, reject) => {
        gitProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`git clone failed with code ${code}`));
          }
        });

        gitProcess.on('error', (error) => {
          reject(error);
        });
      });

      // Check for specific commit
      if (config.commit) {
        const commitHash = config.commit; // Capture in variable for type safety

        updateProgress(installId, {
          progress: 50,
          message: 'Checking out specific commit...',
          currentStep: 'Checkout commit',
          currentStepNumber: 2,
        });

        // Validate commit hash format (7-40 hexadecimal characters for git SHA-1)
        const commitRegex = /^[a-f0-9]{7,40}$/i;
        if (!commitRegex.test(commitHash)) {
          throw new Error('Invalid commit hash format. Must be 7-40 hexadecimal characters.');
        }

        // Use spawn instead of exec to prevent shell injection
        await new Promise<void>((resolve, reject) => {
          const gitCheckout = spawn('git', ['checkout', commitHash], {
            cwd: installDir,
          });

          let errorOutput = '';

          gitCheckout.stderr?.on('data', (data) => {
            errorOutput += data.toString();
          });

          gitCheckout.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Git checkout failed: ${errorOutput}`));
            }
          });

          gitCheckout.on('error', (error) => {
            reject(new Error(`Failed to spawn git process: ${error.message}`));
          });
        });
      }

      // Install dependencies if package.json exists
      updateProgress(installId, {
        status: 'installing',
        progress: 60,
        message: 'Installing dependencies...',
        currentStep: 'Installing dependencies',
        currentStepNumber: 3,
      });

      const targetDir = config.subPath ? join(installDir, config.subPath) : installDir;

      try {
        await access(join(targetDir, 'package.json'));

        // Run npm install
        await execAsync('npm install', {
          cwd: targetDir,
        });
      } catch {
        // No package.json, skip dependency installation
      }

      // Complete installation
      updateProgress(installId, {
        status: 'completed',
        progress: 100,
        message: 'Installation completed successfully',
        currentStep: 'Completed',
        currentStepNumber: 4,
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      updateProgress(installId, {
        status: 'failed',
        progress: 0,
        message: 'Installation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      });
    }
  })();

  return { installId, progress };
}

/**
 * Install from local path
 */
export async function installLocalPath(
  config: LocalInstallConfig
): Promise<{ installId: string; progress: InstallationProgress }> {
  const installId = nanoid();

  // Initialize progress
  const progress: InstallationProgress = {
    installId,
    status: 'pending',
    progress: 0,
    message: 'Validating local path...',
    startedAt: new Date().toISOString(),
    logs: [],
  };

  activeInstallations.set(installId, progress);

  // Start installation in background
  (async () => {
    try {
      // Validate path
      const validation = await validateLocalPath(config.path);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid path');
      }

      updateProgress(installId, {
        status: 'configuring',
        progress: 50,
        message: 'Configuring local server...',
        currentStep: 'Configuring',
        totalSteps: 2,
        currentStepNumber: 1,
      });

      // For local paths, we just validate and reference the path
      // No actual installation needed

      updateProgress(installId, {
        status: 'completed',
        progress: 100,
        message: 'Local server configured successfully',
        currentStep: 'Completed',
        currentStepNumber: 2,
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      updateProgress(installId, {
        status: 'failed',
        progress: 0,
        message: 'Configuration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      });
    }
  })();

  return { installId, progress };
}

/**
 * Main installation function
 */
export async function installServer(
  config: InstallConfig,
  _serverName: string,
  _serverDescription?: string
): Promise<{ installId: string; progress: InstallationProgress }> {
  // Validate configuration first
  const validation = await validateInstallation(config);
  if (!validation.valid) {
    throw new Error(`Installation validation failed: ${validation.errors.join(', ')}`);
  }

  // Route to appropriate installer
  // Note: serverName and serverDescription are accepted for future use but not currently passed to installers
  switch (config.source) {
    case 'npm':
      return installNPMPackage(config);
    case 'github':
      return installGitHubRepo(config);
    case 'local':
      return installLocalPath(config);
    default:
      throw new Error(`Unknown installation source: ${(config as InstallConfig).source}`);
  }
}

