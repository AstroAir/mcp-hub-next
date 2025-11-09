'use client';

/**
 * Install Server Dialog Component
 * Provides UI for installing MCP servers from various sources
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('components.installServer');
  const actions = useTranslations('common.actions');
  const troubleshooting = useTranslations('components.troubleshooting');
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
          setError(t('errors.packageNameRequired'));
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
          setError(t('errors.repositoryRequired'));
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
          setError(t('errors.pathRequired'));
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
          setError(response.data.errors.join(', ') || t('errors.validationFailed'));
        } else if (response.data.warnings.length > 0) {
          setValidationWarnings(response.data.warnings);
        }
      } else {
        setError(response.error || t('errors.validationFailed'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errors.validationFailed');
      setError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstall = async () => {
    setError(null);

    if (!serverName) {
      setError(t('errors.serverNameRequired'));
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
        const msg = response.error || t('errors.installationFailed');
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errors.installationFailed');
      setError(msg);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
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
                  <LifeBuoy className="h-4 w-4" /> {t('alerts.troubleshooting')}
                </div>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {getTroubleshootingTips(error).map((tipKey) => (
                    <li key={tipKey}>{troubleshooting(tipKey)}</li>
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
                <div className="font-semibold mb-1">{t('alerts.warningsTitle')}</div>
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
                {t('tabs.npm')}
              </TabsTrigger>
              <TabsTrigger value="github">
                <Github className="h-4 w-4 mr-2" />
                {t('tabs.github')}
              </TabsTrigger>
              <TabsTrigger value="local">
                <FolderOpen className="h-4 w-4 mr-2" />
                {t('tabs.local')}
              </TabsTrigger>
            </TabsList>

            {/* NPM Tab */}
            <TabsContent value="npm" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="npm-package">{t('fields.npm.packageLabel')}</Label>
                <Input
                  id="npm-package"
                  placeholder={t('fields.npm.packagePlaceholder')}
                  value={npmPackage}
                  onChange={(e) => setNpmPackage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npm-version">{t('fields.npm.versionLabel')}</Label>
                <Input
                  id="npm-version"
                  placeholder={t('fields.npm.versionPlaceholder')}
                  value={npmVersion}
                  onChange={(e) => setNpmVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npm-registry">{t('fields.npm.registryLabel')}</Label>
                <Input
                  id="npm-registry"
                  placeholder={t('fields.npm.registryPlaceholder')}
                  value={npmRegistry}
                  onChange={(e) => setNpmRegistry(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* GitHub Tab */}
            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-repo">{t('fields.github.repoLabel')}</Label>
                <Input
                  id="github-repo"
                  placeholder={t('fields.github.repoPlaceholder')}
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github-branch">{t('fields.github.branchLabel')}</Label>
                  <Input
                    id="github-branch"
                    placeholder={t('fields.github.branchPlaceholder')}
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github-tag">{t('fields.github.tagLabel')}</Label>
                  <Input
                    id="github-tag"
                    placeholder={t('fields.github.tagPlaceholder')}
                    value={githubTag}
                    onChange={(e) => setGithubTag(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-subpath">{t('fields.github.subPathLabel')}</Label>
                <Input
                  id="github-subpath"
                  placeholder={t('fields.github.subPathPlaceholder')}
                  value={githubSubPath}
                  onChange={(e) => setGithubSubPath(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Local Tab */}
            <TabsContent value="local" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="local-path">{t('fields.local.pathLabel')}</Label>
                <Input
                  id="local-path"
                  placeholder={t('fields.local.pathPlaceholder')}
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="server-name">{t('fields.common.nameLabel')}</Label>
              <Input
                id="server-name"
                placeholder={t('fields.common.namePlaceholder')}
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-description">{t('fields.common.descriptionLabel')}</Label>
              <Input
                id="server-description"
                placeholder={t('fields.common.descriptionPlaceholder')}
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
              {t('actions.validate')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {actions('cancel')}
              </Button>
              <Button onClick={handleInstall} disabled={isValidating || isInstalling}>
                {isInstalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {error ? t('actions.retry') : t('actions.install')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

