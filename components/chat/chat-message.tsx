'use client';

/**
 * ChatMessage Component
 * Displays a single chat message with enhanced features
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import {
  User,
  Bot,
  Copy,
  Check,
  AlertCircle,
  Download,
  File,
  Image as ImageIcon,
  FileText,
  Archive,
  Code as CodeIcon,
  Music,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from './code-block';
import { ImagePreviewDialog } from './image-preview-dialog';
import { PdfPreviewDialog } from './pdf-preview-dialog';
import {
  formatFileSize,
  isImageFile,
  getFileIcon,
  downloadAttachment,
} from '@/lib/utils/file-upload';

// Helper function to parse markdown code blocks
function parseMessageContent(content: string) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add code block
    parts.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'text',
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const t = useTranslations('chat.message');
  const isUser = message.role === 'user';
  const contentParts = parseMessageContent(message.content);
  const [copied, setCopied] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pdfPreviewSrc, setPdfPreviewSrc] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 transition-colors hover:bg-muted/30',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      {/* Avatar */}
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={cn(
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 space-y-2 min-w-0">
        {/* Header with name and actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isUser ? t('user') : t('assistant')}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 sm:size-7"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-4 sm:size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-4 sm:size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? t('copied') : t('copy')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Message content */}
        <div className="text-sm space-y-2 leading-relaxed">
          {contentParts.map((part, index) => (
            part.type === 'code' ? (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language}
              />
            ) : (
              <div key={index} className="whitespace-pre-wrap break-words">
                {part.content}
              </div>
            )
          ))}
        </div>

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {t('attachmentsCount', { count: message.attachments.length })}
              </Badge>
            </div>
            <div className="grid w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {message.attachments.map((attachment) => {
                const isImage = isImageFile(attachment.type);
                const isPdf = attachment.type === 'application/pdf';
                const iconName = getFileIcon(attachment.type);
                const IconComponent = {
                  Image: ImageIcon,
                  FileText: FileText,
                  Archive: Archive,
                  Code: CodeIcon,
                  Music: Music,
                  Video: Video,
                  File: File,
                }[iconName] || File;

                return (
                  <Card
                    key={attachment.id}
                    className="p-3 bg-muted/30 border-muted hover:bg-muted/50 transition-colors w-full min-w-0"
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview or icon */}
                      {isImage && attachment.url ? (
                        <div className="size-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="size-full object-cover cursor-zoom-in"
                            onClick={() => setPreviewSrc(attachment.url!)}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="size-16 rounded bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80 transition"
                          onClick={() => isPdf && attachment.url ? setPdfPreviewSrc(attachment.url) : undefined}
                          aria-label={isPdf ? t('previewPdf') : t('attachmentIcon')}
                        >
                          <IconComponent className="size-8 text-muted-foreground" />
                        </button>
                      )}

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" title={attachment.name}>
                          {attachment.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(attachment.size)}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {isPdf && attachment.url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 sm:h-7 text-xs"
                                  onClick={() => setPdfPreviewSrc(attachment.url!)}
                                >
                                  <FileText className="size-3.5 sm:size-3 mr-1" />
                                  {t('previewButton')}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('previewTooltip', { name: attachment.name })}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 sm:h-7 text-xs"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="size-3.5 sm:size-3 mr-1" />
                              {t('download')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('downloadTooltip', { name: attachment.name })}
                          </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {previewSrc && (
          <ImagePreviewDialog
            open={!!previewSrc}
            src={previewSrc}
            alt={t('imagePreviewAlt')}
            onOpenChange={(o) => !o && setPreviewSrc(null)}
          />
        )}
        {pdfPreviewSrc && (
          <PdfPreviewDialog
            open={!!pdfPreviewSrc}
            src={pdfPreviewSrc}
            title={t('pdfPreviewTitle')}
            onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
          />
        )}
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((toolCall) => {
              const matchingResult = message.toolResults?.find(r => r.toolCallId === toolCall.id);
              const status: 'requested' | 'success' | 'error' = matchingResult ? (matchingResult.isError ? 'error' : 'success') : 'requested';
              return (
                <Card key={toolCall.id} className="p-3 bg-muted/50 border-muted">
                  <div className="flex items-start gap-3">
                    <AlertCircle className={cn('size-4 mt-0.5 shrink-0', status === 'requested' ? 'text-blue-500' : status === 'success' ? 'text-green-600' : 'text-destructive')} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium">{t('toolCall.title', { name: toolCall.name })}</div>
                        <Badge variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {status === 'requested' ? t('toolCall.status.requested') : status === 'success' ? t('toolCall.status.success') : t('toolCall.status.error')}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{t('toolCall.parameters')}</div>
                        <CodeBlock language="json" code={JSON.stringify(toolCall.input, null, 2)} />
                      </div>
                      {matchingResult && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{t('toolCall.response')}</div>
                          {matchingResult.isError ? (
                            <div className="text-xs text-destructive">{matchingResult.error || t('toolCall.unknownError')}</div>
                          ) : (
                            <CodeBlock language="json" code={JSON.stringify(matchingResult.result, null, 2)} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tool results */}
        {/* Results are inlined above per tool call; keep legacy block for any stray results without a matching call */}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="space-y-2">
            {message.toolResults
              .filter(r => !(message.toolCalls || []).some(tc => tc.id === r.toolCallId))
              .map((result) => (
                <Card
                  key={result.toolCallId}
                  className={cn(
                    'p-3 border',
                    result.isError
                      ? 'bg-destructive/10 border-destructive/50'
                      : 'bg-muted/50 border-muted'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={cn(
                        'size-4 mt-0.5 shrink-0',
                        result.isError ? 'text-destructive' : 'text-green-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">
                          {t('toolResult.title', { name: result.toolName })}
                        </div>
                      {result.isError ? (
                          <div className="text-xs text-destructive mt-1">
                            {t('toolResult.error', { message: result.error ?? '' })}
                          </div>
                      ) : (
                        <CodeBlock language="json" code={JSON.stringify(result.result, null, 2)} />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

