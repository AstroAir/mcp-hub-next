'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PdfPreviewDialogProps {
  open: boolean;
  src: string;
  title?: string;
  onOpenChange: (open: boolean) => void;
}

export function PdfPreviewDialog({ open, src, title = 'PDF preview', onOpenChange }: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden')} aria-label={title}>
        {/* Use iframe for broad browser PDF support */}
        <iframe
          src={src}
          title={title}
          className="w-full h-full bg-background"
        />
      </DialogContent>
    </Dialog>
  );
}
