'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Star,
  Download,
  Key,
  ExternalLink,
  Calendar,
  GitBranch,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { MarketplaceMCPServer } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { installationAPI } from '@/lib/services/api-client';
import { useServerStore } from '@/lib/stores';
import { InstallationProgressCard } from '@/components/mcp/installation-progress';
import { toast } from 'sonner';
import { shouldNotify, buildErrorKey } from '@/lib/utils/error-dedupe';

interface MarketplaceServerDetailProps {
  server: MarketplaceMCPServer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketplaceServerDetail({ server, open, onOpenChange }: MarketplaceServerDetailProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installId, setInstallId] = useState<string | null>(null);
  const { setInstallationProgress } = useServerStore();

  if (!server) return null;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(server.mcpId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleGitHubClick = () => {
    window.open(server.githubUrl, '_blank', 'noopener,noreferrer');
  };

  const parseGithubRepo = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com') return null;
      const parts = u.pathname.replace(/\.git$/, '').split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return `${parts[0]}/${parts[1]}`;
    } catch {
      return null;
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const repo = parseGithubRepo(server.githubUrl);
      if (!repo) {
        toast.error('Unable to parse GitHub repository for this server');
        setInstalling(false);
        return;
      }
      const res = await installationAPI.install({
        config: { source: 'github', repository: repo },
        serverName: server.name,
        serverDescription: server.description,
      });
      if (res.success && res.data) {
        setInstallationProgress(res.data.installId, res.data.progress);
        useServerStore.getState().registerInstallationRequest?.(res.data.installId, { config: { source: 'github', repository: repo }, serverName: server.name, serverDescription: server.description });
        setInstallId(res.data.installId);
        toast.success(`Installing ${server.name}...`);
      } else {
        const msg = res.error || 'Failed to start installation';
        if (shouldNotify(buildErrorKey('install-start', server.mcpId, msg))) {
          toast.error(msg);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start installation';
      if (shouldNotify(buildErrorKey('install-start', server.mcpId, msg))) {
        toast.error(msg);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100vw-2rem,1100px)] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={server.logoUrl} alt={server.name} />
              <AvatarFallback className="text-lg font-semibold">
                {server.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <DialogTitle className="text-2xl">{server.name}</DialogTitle>
                {server.isRecommended && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Recommended
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-base">
                by {server.author}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Description */}
            <p className="text-base text-foreground leading-relaxed">{server.description}</p>

            {/* Stats and Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{server.githubStars.toLocaleString()}</span>
                <span className="text-muted-foreground">stars</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{server.downloadCount.toLocaleString()}</span>
                <span className="text-muted-foreground">downloads</span>
              </div>
              {server.requiresApiKey && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                  <Key className="h-4 w-4" />
                  <span className="font-medium">Requires API Key</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Updated {new Date(server.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Category and Tags */}
            <div className="space-y-3">
              {server.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-[70px]">Category:</span>
                  <Badge variant="secondary">{server.category}</Badge>
                </div>
              )}
              {server.tags && server.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground min-w-[70px] pt-1">Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {server.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MCP ID */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">MCP Server ID</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="h-8"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border">
                <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <code className="text-sm flex-1 font-mono break-all leading-relaxed">{server.mcpId}</code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleGitHubClick}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
              <Button onClick={handleInstall} className="flex-1" disabled={installing}>
                {installing ? 'Installing…' : 'Install'}
              </Button>
            </div>

            {installId && (
              <div className="pt-2">
                <InstallationProgressCard
                  installId={installId}
                  onComplete={() => toast.success(`${server.name} installed`)}
                  onError={(msg) => {
                    if (shouldNotify(buildErrorKey('install-fail', installId || server.mcpId, msg))) {
                      toast.error(msg);
                    }
                  }}
                  onRetry={async () => {
                    const repo = parseGithubRepo(server.githubUrl);
                    if (!repo) return;
                    const res = await installationAPI.install({
                      config: { source: 'github', repository: repo },
                      serverName: server.name,
                      serverDescription: server.description,
                    });
                    if (res.success && res.data) {
                      setInstallationProgress(res.data.installId, res.data.progress);
                      useServerStore.getState().registerInstallationRequest?.(res.data.installId, { config: { source: 'github', repository: repo }, serverName: server.name, serverDescription: server.description });
                      setInstallId(res.data.installId);
                    } else {
                      const msg = res.error || 'Failed to start installation';
                      if (shouldNotify(buildErrorKey('install-retry', installId || server.mcpId, msg))) {
                        toast.error(msg);
                      }
                    }
                  }}
                />
              </div>
            )}

            <Separator />

            {/* Collapsible README */}
            <Collapsible open={readmeOpen} onOpenChange={setReadmeOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-semibold text-base hover:bg-transparent"
                >
                  <span>README</span>
                  {readmeOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ScrollArea className="h-[500px] rounded-md border bg-muted/30">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                    <ReactMarkdown>{server.readmeContent}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

