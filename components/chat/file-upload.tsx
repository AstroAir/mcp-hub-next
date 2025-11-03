'use client';

/**
 * FileUpload Component
 * Handles file selection, validation, and preview for chat attachments
 */

import { useRef } from 'react';
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

interface FileUploadProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  config?: FileUploadConfig;
  disabled?: boolean;
  className?: string;
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
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (attachments.length + files.length > config.maxFiles) {
      toast.error(`Maximum ${config.maxFiles} files allowed`);
      return;
    }

    // Validate and convert files
    const newAttachments: FileAttachment[] = [];
    
    for (const file of files) {
      const validation = validateFile(file, config);
      
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        continue;
      }

      try {
        const attachment = await fileToAttachment(file);
        newAttachments.push(attachment);
      } catch (error) {
        console.error('Failed to process file:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`Added ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}`);
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
      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={config.allowedExtensions.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

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
            ? `Maximum ${config.maxFiles} files reached`
            : 'Attach files'}
        </TooltipContent>
      </Tooltip>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => {
            const Icon = getIconComponent(attachment.type);
            const isImage = isImageFile(attachment.type);

            return (
              <Card
                key={attachment.id}
                className="relative p-2 flex items-center gap-2 max-w-xs group"
              >
                {/* Preview or icon */}
                {isImage && attachment.url ? (
                  <div className="size-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
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
      {attachments.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {attachments.length} / {config.maxFiles} files
          </Badge>
          <span className="text-xs text-muted-foreground">
            Max {formatFileSize(config.maxFileSize)} per file
          </span>
        </div>
      )}
    </div>
  );
}

