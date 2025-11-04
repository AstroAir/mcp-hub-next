'use client';

/**
 * Install Server Dialog Component
 * Provides UI for installing MCP servers from various sources
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Github, FolderOpen, AlertCircle, LifeBuoy } from 'lucide-react';
import { installationAPI } from '@/lib/services/api-client';
import { useServerStore } from '@/lib/stores/server-store';
import type { InstallConfig, NPMInstallConfig, GitHubInstallConfig, LocalInstallConfig } from '@/lib/types';
import { getTroubleshootingTips } from '@/lib/utils/error-dedupe';

interface InstallServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallServerDialog({ open, onOpenChange }: InstallServerDialogProps) {
  const [source, setSource] = useState<'npm' | 'github' | 'local'>('npm');
  const [isValidating, setIsValidating] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // NPM fields
  const [npmPackage, setNpmPackage] = useState('');
  const [npmVersion, setNpmVersion] = useState('');
  const [npmRegistry, setNpmRegistry] = useState('');

  // GitHub fields
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('');
  const [githubTag, setGithubTag] = useState('');
  const [githubSubPath, setGithubSubPath] = useState('');

  // Local fields
  const [localPath, setLocalPath] = useState('');

  // Common fields
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [autoStart, setAutoStart] = useState(false);

  const { setInstallationProgress } = useServerStore();

  const resetForm = () => {
    setNpmPackage('');
    setNpmVersion('');
    setNpmRegistry('');
    setGithubRepo('');
    setGithubBranch('');
    setGithubTag('');
    setGithubSubPath('');
    setLocalPath('');
    setServerName('');
    setServerDescription('');
    setAutoStart(false);
    setError(null);
    setValidationWarnings([]);
  };

  const buildInstallConfig = (): InstallConfig | null => {
    switch (source) {
      case 'npm':
        if (!npmPackage) {
          setError('Package name is required');
          return null;
        }
        return {
          source: 'npm',
          packageName: npmPackage,
          version: npmVersion || undefined,
          registry: npmRegistry || undefined,
        } as NPMInstallConfig;

      case 'github':
        if (!githubRepo) {
          setError('Repository is required');
          return null;
        }
        return {
          source: 'github',
          repository: githubRepo,
          branch: githubBranch || undefined,
          tag: githubTag || undefined,
          subPath: githubSubPath || undefined,
        } as GitHubInstallConfig;

      case 'local':
        if (!localPath) {
          setError('Path is required');
          return null;
        }
        return {
          source: 'local',
          path: localPath,
          validate: true,
        } as LocalInstallConfig;

      default:
        return null;
    }
  };

  const handleValidate = async () => {
    setError(null);
    setValidationWarnings([]);

    const config = buildInstallConfig();
    if (!config) return;

    setIsValidating(true);

    try {
      const response = await installationAPI.validate({ config });

      if (response.success && response.data) {
        if (!response.data.valid) {
          setError(response.data.errors.join(', '));
        } else if (response.data.warnings.length > 0) {
          setValidationWarnings(response.data.warnings);
        }
      } else {
        setError(response.error || 'Validation failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      setError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstall = async () => {
    setError(null);

    if (!serverName) {
      setError('Server name is required');
      return;
    }

    const config = buildInstallConfig();
    if (!config) return;

    setIsInstalling(true);

    try {
      const response = await installationAPI.install({
        config,
        serverName,
        serverDescription,
        autoStart,
      });

      if (response.success && response.data) {
        // Store installation progress
        setInstallationProgress(response.data.installId, response.data.progress);
        useServerStore.getState().registerInstallationRequest?.(response.data.installId, { config, serverName, serverDescription });

        // Close dialog
        resetForm();
        onOpenChange(false);
      } else {
        const msg = response.error || 'Installation failed';
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Installation failed';
      setError(msg);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Install MCP Server</DialogTitle>
          <DialogDescription>
            Install an MCP server from npm, GitHub, or a local path
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert with guidance and retry */}
          {error && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="rounded-md border p-3 bg-muted/40">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <LifeBuoy className="h-4 w-4" /> Troubleshooting
                </div>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {getTroubleshootingTips(error).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Warnings:</div>
                <ul className="list-disc list-inside">
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Source Selection */}
          <Tabs value={source} onValueChange={(v) => setSource(v as typeof source)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="npm">
                <Package className="h-4 w-4 mr-2" />
                NPM
              </TabsTrigger>
              <TabsTrigger value="github">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="local">
                <FolderOpen className="h-4 w-4 mr-2" />
                Local
              </TabsTrigger>
            </TabsList>

            {/* NPM Tab */}
            <TabsContent value="npm" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="npm-package">Package Name *</Label>
                <Input
                  id="npm-package"
                  placeholder="@modelcontextprotocol/server-filesystem"
                  value={npmPackage}
                  onChange={(e) => setNpmPackage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npm-version">Version (optional)</Label>
                <Input
                  id="npm-version"
                  placeholder="latest"
                  value={npmVersion}
                  onChange={(e) => setNpmVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npm-registry">Registry URL (optional)</Label>
                <Input
                  id="npm-registry"
                  placeholder="https://registry.npmjs.org"
                  value={npmRegistry}
                  onChange={(e) => setNpmRegistry(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* GitHub Tab */}
            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-repo">Repository *</Label>
                <Input
                  id="github-repo"
                  placeholder="owner/repository"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github-branch">Branch (optional)</Label>
                  <Input
                    id="github-branch"
                    placeholder="main"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github-tag">Tag (optional)</Label>
                  <Input
                    id="github-tag"
                    placeholder="v1.0.0"
                    value={githubTag}
                    onChange={(e) => setGithubTag(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-subpath">Sub-path (optional)</Label>
                <Input
                  id="github-subpath"
                  placeholder="packages/server"
                  value={githubSubPath}
                  onChange={(e) => setGithubSubPath(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Local Tab */}
            <TabsContent value="local" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="local-path">Path *</Label>
                <Input
                  id="local-path"
                  placeholder="/path/to/server"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name *</Label>
              <Input
                id="server-name"
                placeholder="My MCP Server"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-description">Description (optional)</Label>
              <Input
                id="server-description"
                placeholder="Description of the server"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={isValidating || isInstalling}
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleInstall} disabled={isValidating || isInstalling}>
                {isInstalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {error ? 'Retry Install' : 'Install'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

