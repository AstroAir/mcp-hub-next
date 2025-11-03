/**
 * CommandPalette Component
 * Global command palette with fuzzy search (Cmd/Ctrl+K)
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  MessageSquare,
  Settings,
  Bug,
  Plus,
  Play,
  Square,
  Library,
  Search,
  Download,
  Upload,
  Server,
} from 'lucide-react';
import { useServerStore, useConnectionStore } from '@/lib/stores';
import type { LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  category: 'navigation' | 'server' | 'chat' | 'settings' | 'recent';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Load recent commands from localStorage
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load recent commands:', error);
        return [];
      }
    }
    return [];
  });

  // Save recent command
  const saveRecentCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 10);
      localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Build command list
  const commands = useMemo((): Command[] => {
    const cmds: Command[] = [
      // Navigation commands
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View all servers',
        icon: Home,
        category: 'navigation',
        action: () => router.push('/'),
        keywords: ['home', 'servers', 'main'],
      },
      {
        id: 'nav-chat',
        label: 'Go to Chat',
        description: 'Chat with Claude',
        icon: MessageSquare,
        category: 'navigation',
        action: () => router.push('/chat'),
        keywords: ['conversation', 'claude', 'ai'],
      },
      {
        id: 'nav-developer',
        label: 'Go to Developer Tools',
        description: 'Debug and monitor',
        icon: Bug,
        category: 'navigation',
        action: () => router.push('/developer'),
        keywords: ['debug', 'logs', 'metrics'],
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Configure application',
        icon: Settings,
        category: 'navigation',
        action: () => router.push('/settings'),
        keywords: ['config', 'preferences', 'backup'],
      },
      // Server commands
      {
        id: 'server-add',
        label: 'Add New Server',
        description: 'Create a new MCP server',
        icon: Plus,
        category: 'server',
        action: () => {
          router.push('/');
          // Trigger server form open
          setTimeout(() => {
            const addButton = document.querySelector('[data-command="add-server"]') as HTMLButtonElement;
            addButton?.click();
          }, 100);
        },
        keywords: ['create', 'new', 'configure'],
      },
      {
        id: 'server-templates',
        label: 'Browse Server Templates',
        description: 'Use pre-configured templates',
        icon: Library,
        category: 'server',
        action: () => {
          router.push('/');
          setTimeout(() => {
            const templatesButton = document.querySelector('[data-command="templates"]') as HTMLButtonElement;
            templatesButton?.click();
          }, 100);
        },
        keywords: ['examples', 'presets', 'quick'],
      },
      // Settings commands
      {
        id: 'settings-export',
        label: 'Export Data',
        description: 'Download all data',
        icon: Download,
        category: 'settings',
        action: () => router.push('/settings?action=export'),
        keywords: ['backup', 'save', 'download'],
      },
      {
        id: 'settings-import',
        label: 'Import Data',
        description: 'Restore from backup',
        icon: Upload,
        category: 'settings',
        action: () => router.push('/settings?action=import'),
        keywords: ['restore', 'load', 'upload'],
      },
    ];

    // Add server-specific commands
    servers.forEach((server) => {
      const isConnected = connections[server.id]?.status === 'connected';
      
      cmds.push({
        id: `server-${server.id}-view`,
        label: `View ${server.name}`,
        description: `Open ${server.name} details`,
        icon: Server,
        category: 'server',
        action: () => router.push(`/servers/${server.id}`),
        keywords: ['server', server.name.toLowerCase(), 'details'],
      });

      if (isConnected) {
        cmds.push({
          id: `server-${server.id}-disconnect`,
          label: `Disconnect ${server.name}`,
          description: `Stop ${server.name}`,
          icon: Square,
          category: 'server',
          action: () => {
            // Trigger disconnect
            const event = new CustomEvent('command-palette-action', {
              detail: { action: 'disconnect', serverId: server.id },
            });
            window.dispatchEvent(event);
          },
          keywords: ['stop', server.name.toLowerCase()],
        });
      } else {
        cmds.push({
          id: `server-${server.id}-connect`,
          label: `Connect ${server.name}`,
          description: `Start ${server.name}`,
          icon: Play,
          category: 'server',
          action: () => {
            const event = new CustomEvent('command-palette-action', {
              detail: { action: 'connect', serverId: server.id },
            });
            window.dispatchEvent(event);
          },
          keywords: ['start', server.name.toLowerCase()],
        });
      }
    });

    return cmds;
  }, [servers, connections, router]);

  // Fuzzy search implementation
  const filteredCommands = useMemo(() => {
    if (!search) {
      // Show recent commands first when no search
      const recent = commands.filter((cmd) => recentCommands.includes(cmd.id));
      const others = commands.filter((cmd) => !recentCommands.includes(cmd.id));
      return [...recent, ...others];
    }

    const searchLower = search.toLowerCase();
    const scored = commands.map((cmd) => {
      let score = 0;
      const labelLower = cmd.label.toLowerCase();
      const descLower = cmd.description?.toLowerCase() || '';
      const keywords = cmd.keywords?.join(' ').toLowerCase() || '';

      // Exact match
      if (labelLower === searchLower) score += 100;
      // Starts with
      if (labelLower.startsWith(searchLower)) score += 50;
      // Contains
      if (labelLower.includes(searchLower)) score += 25;
      // Description match
      if (descLower.includes(searchLower)) score += 10;
      // Keywords match
      if (keywords.includes(searchLower)) score += 15;

      // Fuzzy match (simple implementation)
      let fuzzyScore = 0;
      let searchIndex = 0;
      for (let i = 0; i < labelLower.length && searchIndex < searchLower.length; i++) {
        if (labelLower[i] === searchLower[searchIndex]) {
          fuzzyScore++;
          searchIndex++;
        }
      }
      if (searchIndex === searchLower.length) {
        score += fuzzyScore * 2;
      }

      return { cmd, score };
    });

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }, [commands, search, recentCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      const category = recentCommands.includes(cmd.id) && !search ? 'recent' : cmd.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands, recentCommands, search]);

  // Execute command handler
  const executeCommand = useCallback((cmd: Command) => {
    saveRecentCommand(cmd.id);
    cmd.action();
    onOpenChange(false);
  }, [onOpenChange, saveRecentCommand]);

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;

    // Use a microtask to avoid synchronous setState in effect
    Promise.resolve().then(() => {
      setSearch('');
      setSelectedIndex(0);
    });
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          executeCommand(cmd);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands, executeCommand]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'recent':
        return 'Recent';
      case 'navigation':
        return 'Navigation';
      case 'server':
        return 'Servers';
      case 'chat':
        return 'Chat';
      case 'settings':
        return 'Settings';
      default:
        return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <Input
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[400px]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    {getCategoryLabel(category)}
                  </div>
                  {cmds.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {recentCommands.includes(cmd.id) && !search && (
                          <Badge variant="outline" className="text-xs">
                            Recent
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

