'use client';

/**
 * Configuration File Uploader
 * Upload and import MCP configuration files from various IDEs
 * Supports: Claude Desktop, VS Code, Cursor, Cline/Roo-Cline
 */

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Folder,
  Files,
} from 'lucide-react';
import {
  parseConfiguration,
  validateConfigFile,
  mergeServers,
  getExampleConfig,
  exportToClaudeDesktopConfig,
  parseMultipleFiles,
  filterJsonFiles,
  type ParseResult,
  type AggregatedParseResult,
  type ServerWithSource,
} from '@/lib/utils/config-parser';
import { useServerStore } from '@/lib/stores';
import { toast } from 'sonner';

interface ConfigUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportMode = 'single' | 'multiple' | 'directory';

export function ConfigUploader({ open, onOpenChange }: ConfigUploaderProps) {
  const { servers, addServer } = useServerStore();
  const t = useTranslations('components.configUploader');
  const actions = useTranslations('common.actions');
  const [files, setFiles] = useState<File[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const [parseResult, setParseResult] = useState<ParseResult | AggregatedParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const getFileSelectionLabel = () => {
    if (files.length > 0) {
      if (importMode === 'single') {
        return t('import.selection.singleSelected', { name: files[0]?.name ?? '' });
      }
      return t('import.selection.multipleSelected', { count: String(files.length) });
    }

    return importMode === 'multiple'
      ? t('import.selection.multiplePlaceholder')
      : t('import.selection.singlePlaceholder');
  };

  const getDirectorySelectionLabel = () => {
    if (files.length > 0) {
      return t('import.directory.selected', { count: String(files.length) });
    }
    return t('import.directory.placeholder');
  };

  const getProcessingLabel = () => {
    return files.length > 1
      ? t('status.processingMultiple', { count: String(files.length) })
      : t('status.processingSingle');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    setFiles(fileArray);
    setParseResult(null);

    try {
      setIsProcessing(true);

      // Single file mode
      if (fileArray.length === 1) {
        const selectedFile = fileArray[0];
        const content = await selectedFile.text();

        // Validate first
        const validation = validateConfigFile(content);
        if (!validation.valid) {
          toast.error(t('toast.invalidConfig', { reason: validation.error ?? '' }));
          setFiles([]);
          return;
        }

        // Parse configuration (auto-detects format)
        const result = parseConfiguration(content);
        result.sourceFile = selectedFile.name;
        setParseResult(result);

        if (result.success) {
          const formatLabel = result.detectedFormat
            ? ` (${result.detectedFormat.toUpperCase()})`
            : '';
          toast.success(
            t('toast.parseSuccessSingle', {
              count: String(result.servers.length),
              format: formatLabel,
            })
          );
        } else {
          toast.error(t('toast.parseFailureSingle'));
        }
      } else {
        // Multiple files mode
        const result = await parseMultipleFiles(fileArray);
        setParseResult(result);

        if (result.success) {
          toast.success(
            t('toast.parseSuccessMultiple', {
              total: String(result.totalFiles),
              count: String(result.servers.length),
              success: String(result.successfulFiles),
            })
          );
        } else {
          toast.error(
            t('toast.parseFailureMultiple', { total: String(result.totalFiles) })
          );
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(t('toast.processFailed'));
      setFiles([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectorySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Filter to only JSON files
    const fileArray = filterJsonFiles(Array.from(selectedFiles));

    if (fileArray.length === 0) {
      toast.error(t('toast.directoryNoJson'));
      return;
    }

    setFiles(fileArray);
    setParseResult(null);
    setImportMode('directory');

    try {
      setIsProcessing(true);

      const result = await parseMultipleFiles(fileArray);
      setParseResult(result);

      if (result.success) {
        toast.success(
          t('toast.parseSuccessMultiple', {
            total: String(result.totalFiles),
            count: String(result.servers.length),
            success: String(result.successfulFiles),
          })
        );
      } else {
        toast.error(t('toast.directoryFailed'));
      }
    } catch (error) {
      console.error('Directory processing error:', error);
      toast.error(t('toast.directoryFailed'));
      setFiles([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!parseResult || !parseResult.success) return;

    try {
      // Merge with existing servers (handles duplicates)
      const mergedServers = mergeServers(servers, parseResult.servers);

      // Add only the new servers
      const newServers = mergedServers.slice(servers.length);
      newServers.forEach((server) => addServer(server));

      if (files.length > 1) {
        toast.success(
          t('toast.importSuccessMultiple', {
            count: String(newServers.length),
            files: String(files.length),
          })
        );
      } else {
        toast.success(
          t('toast.importSuccessSingle', { count: String(newServers.length) })
        );
      }
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('toast.importFailure'));
    }
  };

  const handleExport = () => {
    try {
      const config = exportToClaudeDesktopConfig(servers);
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mcp-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('toast.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('toast.exportFailure'));
    }
  };

  const handleDownloadExample = () => {
    const example = getExampleConfig();
    const blob = new Blob([example], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-config-example.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t('toast.downloadSuccess'));
  };

  const resetState = () => {
    setFiles([]);
    setParseResult(null);
    setImportMode('single');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (directoryInputRef.current) {
      directoryInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Type guard to check if result is aggregated
  const isAggregatedResult = (
    result: ParseResult | AggregatedParseResult | null
  ): result is AggregatedParseResult => {
    return result !== null && 'fileResults' in result;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            {t('dialog.title')}
          </DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {/* Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{t('import.title')}</h3>
                <Button variant="ghost" size="sm" onClick={handleDownloadExample}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('import.example')}
                </Button>
              </div>

              {/* Import Mode Selector */}
              <div className="flex gap-2">
                <Button
                  variant={importMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImportMode('single');
                    resetState();
                  }}
                  className="flex-1"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  {t('import.mode.single')}
                </Button>
                <Button
                  variant={importMode === 'multiple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImportMode('multiple');
                    resetState();
                  }}
                  className="flex-1"
                >
                  <Files className="h-4 w-4 mr-2" />
                  {t('import.mode.multiple')}
                </Button>
                <Button
                  variant={importMode === 'directory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImportMode('directory');
                    resetState();
                  }}
                  className="flex-1"
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {t('import.mode.directory')}
                </Button>
              </div>

              {/* File/Directory Upload */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {importMode === 'directory' ? (
                  <>
                    <input
                      ref={directoryInputRef}
                      type="file"
                      // @ts-expect-error webkitdirectory is not in TypeScript DOM lib but supported by Chromium-based browsers
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleDirectorySelect}
                      className="hidden"
                      id="config-directory-input"
                    />
                    <label
                      htmlFor="config-directory-input"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Folder className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {getDirectorySelectionLabel()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('import.directory.help')}
                        </p>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      multiple={importMode === 'multiple'}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="config-file-input"
                    />
                    <label
                      htmlFor="config-file-input"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {getFileSelectionLabel()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('import.fileHelp')}
                        </p>
                      </div>
                    </label>
                  </>
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getProcessingLabel()}
                </div>
              )}
            </div>

          {/* Parse Results */}
          {parseResult && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('results.title')}</h3>

                {/* Success/Error Summary */}
                {parseResult.success ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="flex items-center gap-2 flex-wrap">
                      {t(
                        isAggregatedResult(parseResult)
                          ? 'results.successAggregated'
                          : 'results.success',
                        { count: String(parseResult.servers.length) }
                      )}
                      {isAggregatedResult(parseResult) ? (
                        <>
                          <Badge variant="secondary" className="ml-2">
                            {t('results.filesBadge', {
                              success: String(parseResult.successfulFiles),
                              total: String(parseResult.totalFiles),
                            })}
                          </Badge>
                        </>
                      ) : (
                        parseResult.detectedFormat && (
                          <Badge variant="secondary" className="ml-2">
                            {t('results.formatBadge', {
                              format: parseResult.detectedFormat.toUpperCase(),
                            })}
                          </Badge>
                        )
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {isAggregatedResult(parseResult)
                        ? t('results.failureAggregated', {
                            total: String(parseResult.totalFiles),
                          })
                        : t('results.failure')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">
                      {t('results.errorsTitle')}
                    </p>
                    <ScrollArea className="max-h-32 rounded border p-3">
                      <ul className="space-y-1 text-sm">
                        {isAggregatedResult(parseResult) ? (
                          parseResult.errors.map((error, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium text-xs">{error.file}:</span>{' '}
                                <span>{error.error}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          (parseResult as ParseResult).errors.map((error, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <span>{error}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {/* Warnings */}
                {parseResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-600">
                      {t('results.warningsTitle')}
                    </p>
                    <ScrollArea className="max-h-32 rounded border p-3">
                      <ul className="space-y-1 text-sm">
                        {isAggregatedResult(parseResult) ? (
                          parseResult.warnings.map((warning, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium text-xs">{warning.file}:</span>{' '}
                                <span>{warning.warning}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          (parseResult as ParseResult).warnings.map((warning, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                              <span>{warning}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {/* Servers List */}
                {parseResult.servers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('results.serversTitle')}</p>
                    <div className="max-h-48 rounded border overflow-auto">
                      <div className="p-3 space-y-2">
                        {parseResult.servers.map((serverItem, i) => {
                          const server = serverItem as ServerWithSource;
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded bg-accent/50 gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{server.name}</p>
                                  {server.sourceFile && files.length > 1 && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      {server.sourceFile}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {server.description}
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                {server.transportType}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Export Section */}
          {servers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('export.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('export.description', { count: String(servers.length) })}
                </p>
                <Button variant="outline" onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {t('export.cta')}
                </Button>
              </div>
            </>
          )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t">
          <Button variant="outline" onClick={handleClose}>
            {actions('cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || !parseResult.success || parseResult.servers.length === 0}
          >
            {t('footer.import', { count: String(parseResult?.servers.length ?? 0) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

