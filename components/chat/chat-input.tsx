'use client';

/**
 * ChatInput Component
 * Enhanced input field for sending chat messages with file upload support
 */

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from './file-upload';
import type { FileAttachment } from '@/lib/types';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Type your message... (Enter to send, Shift+Enter for new line)',
  maxLength = 4000
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const canSend = (message.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background">
      <div className="container mx-auto p-4">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <FileUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              disabled={disabled}
              showButton={false}
              showPreview={true}
              showCount={true}
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* File upload button */}
          <FileUpload
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={disabled}
            className="flex items-end"
            showButton={true}
            showPreview={false}
            showCount={false}
          />

          {/* Textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[60px] max-h-[200px] resize-none pr-16",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              rows={2}
            />

            {/* Character count */}
            <div
              className={cn(
                "absolute bottom-2 right-2 text-xs tabular-nums transition-colors",
                isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"
              )}
            >
              {characterCount}/{maxLength}
            </div>
          </div>

          {/* Send button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                disabled={!canSend}
                size="icon"
                className="size-[60px] shrink-0"
              >
                {disabled ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {disabled ? 'Waiting for response...' : 'Send message (Enter)'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd> to send
          {' • '}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Shift</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd> for new line
        </div>
      </div>
    </form>
  );
}

