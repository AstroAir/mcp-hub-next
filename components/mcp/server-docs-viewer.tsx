'use client';

/**
 * MCP Server Documentation Viewer
 * Displays comprehensive documentation for MCP servers
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Search,
  ExternalLink,
  Code,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type { MCPServerDoc } from '@/lib/data/mcp-server-docs';
import { toast } from 'sonner';

interface ServerDocsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId?: string;
}

export function ServerDocsViewer({ open, onOpenChange, serverId }: ServerDocsViewerProps) {
  const [docs, setDocs] = useState<MCPServerDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<MCPServerDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load documentation
  useEffect(() => {
    if (!open) return;

    const loadDocs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/docs/servers');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setDocs(result.data);

          // If serverId provided, select that doc
          if (serverId) {
            const doc = result.data.find((d: MCPServerDoc) => d.id === serverId);
            if (doc) {
              setSelectedDoc(doc);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load documentation:', error);
        toast.error('Failed to load documentation');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocs();
  }, [open, serverId]);

  // Filter docs based on search
  const filteredDocs = searchQuery
    ? docs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : docs;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            MCP Server Documentation
          </DialogTitle>
          <DialogDescription>
            Browse documentation for popular MCP servers
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[calc(85vh-120px)]">
          {/* Sidebar - Server List */}
          <div className="w-64 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground p-2">Loading...</p>
                ) : filteredDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No servers found</p>
                ) : (
                  filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-left p-2 rounded-md hover:bg-accent transition-colors ${
                        selectedDoc?.id === doc.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.category}</div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator orientation="vertical" />

          {/* Main Content - Documentation */}
          <div className="flex-1">
            {selectedDoc ? (
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedDoc.name}</h2>
                        <p className="text-muted-foreground mt-1">{selectedDoc.description}</p>
                      </div>
                      <Badge>{selectedDoc.category}</Badge>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {selectedDoc.githubUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedDoc.githubUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          GitHub
                        </Button>
                      )}
                      {selectedDoc.npmPackage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`https://www.npmjs.com/package/${selectedDoc.npmPackage}`, '_blank')
                          }
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          npm
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Authentication */}
                  {selectedDoc.authentication && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4" />
                        Authentication
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedDoc.authentication.required ? (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">
                            {selectedDoc.authentication.required ? 'Required' : 'Not required'}
                          </span>
                        </div>
                        {selectedDoc.authentication.methods.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Methods: </span>
                            {selectedDoc.authentication.methods.join(', ')}
                          </div>
                        )}
                        {selectedDoc.authentication.envVars && selectedDoc.authentication.envVars.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Environment Variables: </span>
                            {selectedDoc.authentication.envVars.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Configuration */}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4" />
                      Configuration
                    </h3>

                    <Tabs defaultValue="stdio" className="w-full">
                      <TabsList>
                        {selectedDoc.configuration.stdio && <TabsTrigger value="stdio">stdio</TabsTrigger>}
                        {selectedDoc.configuration.sse && <TabsTrigger value="sse">SSE</TabsTrigger>}
                        {selectedDoc.configuration.http && <TabsTrigger value="http">HTTP</TabsTrigger>}
                      </TabsList>

                      {selectedDoc.configuration.stdio && (
                        <TabsContent value="stdio" className="space-y-2">
                          <div className="bg-muted p-3 rounded-md font-mono text-sm relative group">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(
                                {
                                  command: selectedDoc.configuration.stdio.command,
                                  args: selectedDoc.configuration.stdio.args,
                                },
                                null,
                                2
                              )}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(
                                    {
                                      command: selectedDoc.configuration.stdio?.command,
                                      args: selectedDoc.configuration.stdio?.args,
                                    },
                                    null,
                                    2
                                  )
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {selectedDoc.configuration.stdio.notes && (
                            <p className="text-sm text-muted-foreground">{selectedDoc.configuration.stdio.notes}</p>
                          )}
                        </TabsContent>
                      )}

                      {selectedDoc.configuration.sse && (
                        <TabsContent value="sse" className="space-y-2">
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(
                                {
                                  url: selectedDoc.configuration.sse.url,
                                  headers: selectedDoc.configuration.sse.headers,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                          {selectedDoc.configuration.sse.notes && (
                            <p className="text-sm text-muted-foreground">{selectedDoc.configuration.sse.notes}</p>
                          )}
                        </TabsContent>
                      )}

                      {selectedDoc.configuration.http && (
                        <TabsContent value="http" className="space-y-2">
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(
                                {
                                  url: selectedDoc.configuration.http.url,
                                  headers: selectedDoc.configuration.http.headers,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                          {selectedDoc.configuration.http.notes && (
                            <p className="text-sm text-muted-foreground">{selectedDoc.configuration.http.notes}</p>
                          )}
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>

                  {/* Features */}
                  {selectedDoc.features.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Features</h3>
                      <ul className="space-y-1">
                        {selectedDoc.features.map((feature, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requirements */}
                  {selectedDoc.requirements && selectedDoc.requirements.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Requirements</h3>
                      <ul className="space-y-1">
                        {selectedDoc.requirements.map((req, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedDoc.notes && selectedDoc.notes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <ul className="space-y-1">
                        {selectedDoc.notes.map((note, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a server to view documentation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

