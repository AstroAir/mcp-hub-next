'use client';

/**
 * FileUpload Component
 * Handles file selection, validation, and preview for chat attachments
 */

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Paperclip, 
  X, 
  File, 
  Image as ImageIcon,
  FileText,
  Archive,
  Code,
  Music,
  Video,
  Sheet,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileAttachment, FileUploadConfig } from '@/lib/types';
import { 
  validateFile, 
  fileToAttachment, 
  formatFileSize,
  isImageFile,
  getFileIcon,
  DEFAULT_FILE_UPLOAD_CONFIG,
} from '@/lib/utils/file-upload';
import { toast } from 'sonner';
import { ImagePreviewDialog } from './image-preview-dialog';
import { PdfPreviewDialog } from './pdf-preview-dialog';

interface FileUploadProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  config?: FileUploadConfig;
  disabled?: boolean;
  className?: string;
  /** Control which subparts render. Defaults render everything */
  showButton?: boolean;
  showPreview?: boolean;
  showCount?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image: ImageIcon,
  FileText: FileText,
  Archive: Archive,
  Code: Code,
  Music: Music,
  Video: Video,
  Sheet: Sheet,
  Presentation: Presentation,
  File: File,
};

export function FileUpload({
  attachments,
  onAttachmentsChange,
  config = DEFAULT_FILE_UPLOAD_CONFIG,
  disabled = false,
  className,
  showButton = true,
  showPreview = true,
  showCount = true,
}: FileUploadProps) {
  const t = useTranslations('chat.fileUpload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pdfPreviewSrc, setPdfPreviewSrc] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (attachments.length + files.length > config.maxFiles) {
      toast.error(t('errors.maxFilesExceeded', { count: config.maxFiles }));
      return;
    }

    // Validate and convert files
    const newAttachments: FileAttachment[] = [];
    
    for (const file of files) {
      const validation = validateFile(file, config);

      if (!validation.valid) {
        toast.error(validation.error || t('errors.invalidFile'));
        continue;
      }

      try {
        const attachment = await fileToAttachment(file);
        newAttachments.push(attachment);
      } catch (error) {
        console.error('Failed to process file:', error);
        toast.error(t('errors.processingFailed', { filename: file.name }));
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(t('success.filesAdded', { count: newAttachments.length }));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getIconComponent = (fileType: string) => {
    const iconName = getFileIcon(fileType);
    return iconMap[iconName] || File;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden input for selecting files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={config.allowedExtensions.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        aria-label={t('accessibility.attachButton')}
      />

      {/* Upload button (optional) */}
      {showButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleButtonClick}
              disabled={disabled || attachments.length >= config.maxFiles}
              className="size-9"
            >
              <Paperclip className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {attachments.length >= config.maxFiles
              ? t('accessibility.maxFilesReached', { count: config.maxFiles })
              : t('accessibility.attachTooltip')}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Attachments preview */}
      {showPreview && attachments.length > 0 && (
        <div
          className="w-full grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 max-h-44 overflow-y-auto pr-1"
        >
          {attachments.map((attachment) => {
            const Icon = getIconComponent(attachment.type);
            const isImage = isImageFile(attachment.type);
            const isPdf = attachment.type === 'application/pdf';

            return (
              <Card
                key={attachment.id}
                className="relative p-2 flex items-center gap-2 w-full min-w-0 group"
              >
                {/* Preview or icon */}
                {isImage && attachment.url ? (
                  <div className="size-10 rounded overflow-hidden shrink-0 bg-muted">
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
                    className="size-10 rounded bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition"
                    onClick={() => isPdf && attachment.url ? setPdfPreviewSrc(attachment.url) : undefined}
                    aria-label={isPdf ? 'Preview PDF' : 'Attachment icon'}
                  >
                    <Icon className="size-5 text-muted-foreground" />
                  </button>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" title={attachment.name}>
                    {attachment.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1 bg-background border shadow-sm"
                  disabled={disabled}
                >
                  <X className="size-3" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* File count badge */}
      {showCount && attachments.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {attachments.length} / {config.maxFiles} files
          </Badge>
          <span className="text-xs text-muted-foreground">
            Max {formatFileSize(config.maxFileSize)} per file
          </span>
        </div>
      )}

      {/* Image preview dialog */}
      {previewSrc && (
        <ImagePreviewDialog
          open={!!previewSrc}
          src={previewSrc}
          alt={t('accessibility.attachmentPreviewAlt')}
          onOpenChange={(o) => !o && setPreviewSrc(null)}
        />
      )}

      {/* PDF preview dialog */}
      {pdfPreviewSrc && (
        <PdfPreviewDialog
          open={!!pdfPreviewSrc}
          src={pdfPreviewSrc}
          title={t('accessibility.pdfPreviewTitle')}
          onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
        />
      )}
    </div>
  );
}

