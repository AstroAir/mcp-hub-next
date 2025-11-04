'use client';

/**
 * ServerTemplatesDialog Component
 * Dialog for selecting and configuring server templates
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { serverTemplates, templateCategories, type ServerTemplate } from '@/lib/data/server-templates';
import { nanoid } from 'nanoid';
import type { MCPServerConfig } from '@/lib/types';

interface ServerTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (config: MCPServerConfig) => void;
}

export function ServerTemplatesDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: ServerTemplatesDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const handleTemplateClick = (template: ServerTemplate) => {
    setSelectedTemplate(template);
    setConfigValues({});
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const config = { ...selectedTemplate.config };

    // Apply user-provided configuration values
    if (selectedTemplate.requiresConfiguration) {
      selectedTemplate.requiresConfiguration.forEach((field) => {
        const value = configValues[field];
        if (value) {
          if (field.startsWith('env.')) {
            const envKey = field.substring(4);
            (config as { env?: Record<string, string> }).env = { ...(config as { env?: Record<string, string> }).env, [envKey]: value };
          } else if (field === 'args') {
            // Parse args as space-separated values
            (config as { args?: string[] }).args = value.split(' ').filter(Boolean);
          } else if (field === 'url') {
            (config as { url?: string }).url = value;
          }
        }
      });
    }

    const fullConfig = {
      ...config,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MCPServerConfig;

    onSelectTemplate(fullConfig);
    onOpenChange(false);
    setSelectedTemplate(null);
    setConfigValues({});
  };

  const canUseTemplate = () => {
    if (!selectedTemplate) return false;
    if (!selectedTemplate.requiresConfiguration) return true;

    return selectedTemplate.requiresConfiguration.every((field) => {
      const value = configValues[field];
      return value && value.trim().length > 0;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100vw-2rem,1100px)] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Server Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-configured templates for common MCP servers
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[70vh] min-h-[480px]">
          {/* Template List */}
          <div className="md:border-r md:pr-4 overflow-hidden">
            <Tabs defaultValue="all" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 mt-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {serverTemplates.map((template, i) => (
                      <Card
                        key={`${template.id}-${i}`}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleTemplateClick(template)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="popular" className="flex-1 mt-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {serverTemplates.slice(0, 5).map((template, i) => (
                      <Card
                        key={`${template.id}-${i}`}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleTemplateClick(template)}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="categories" className="flex-1 mt-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {templateCategories.map((category) => {
                      const templates = serverTemplates.filter(
                        (t) => t.category === category.id
                      );
                      if (templates.length === 0) return null;

                      return (
                        <div key={category.id}>
                          <h3 className="text-sm font-medium mb-2">
                            {category.icon} {category.label}
                          </h3>
                          <div className="space-y-2">
                            {templates.map((template, i) => (
                              <Card
                                key={`${template.id}-${i}`}
                                className={`cursor-pointer transition-colors ${
                                  selectedTemplate?.id === template.id
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => handleTemplateClick(template)}
                              >
                                <CardHeader className="p-3">
                                  <CardTitle className="text-xs">{template.name}</CardTitle>
                                </CardHeader>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Configuration Panel */}
          <div className="md:pl-4 overflow-auto">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>

                {selectedTemplate.requiresConfiguration &&
                  selectedTemplate.requiresConfiguration.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Configuration Required</h4>
                        <p className="text-xs text-muted-foreground">
                          Please provide the following information:
                        </p>
                      </div>

                      {selectedTemplate.requiresConfiguration.map((field) => (
                        <div key={field} className="space-y-2">
                          <Label htmlFor={field}>
                            {field.startsWith('env.')
                              ? field.substring(4)
                              : field === 'args'
                              ? 'Arguments'
                              : field}
                          </Label>
                          <Input
                            id={field}
                            value={configValues[field] || ''}
                            onChange={(e) =>
                              setConfigValues({ ...configValues, [field]: e.target.value })
                            }
                            placeholder={
                              field === 'args'
                                ? 'Space-separated arguments'
                                : field.startsWith('env.')
                                ? 'Enter value'
                                : 'Enter URL'
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                <div className="pt-4">
                  <Button onClick={handleUseTemplate} disabled={!canUseTemplate()} className="w-full">
                    Use This Template
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a template to get started
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

