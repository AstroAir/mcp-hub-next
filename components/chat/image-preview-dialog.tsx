'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewDialogProps {
  open: boolean;
  src: string;
  alt?: string;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight zoomable image preview using shadcn Dialog (no extra deps).
 * - Wheel or +/- buttons to zoom (1x..5x)
 * - Drag to pan when zoomed
 */
export function ImagePreviewDialog({ open, src, alt, onOpenChange }: ImagePreviewDialogProps) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => Math.min(5, Math.max(1, parseFloat((s + delta).toFixed(2)))));
  }, []);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (scale === 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }, [scale]);

  const onDrag = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOrigin((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const endDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOrigin({ x: 0, y: 0 });
  }, []);

  const controls = useMemo(() => (
    <div className="absolute top-3 right-3 z-10 flex gap-2 rounded bg-background/80 backdrop-blur border p-1">
      <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.min(5, s + 0.2))} title="Zoom in">
        <ZoomIn className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.max(1, s - 0.2))} title="Zoom out">
        <ZoomOut className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={reset} title="Reset">
        <RotateCcw className="size-4" />
      </Button>
    </div>
  ), [reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full bg-black/80">
          {controls}
          <div
            className="w-full h-[80vh] flex items-center justify-center overflow-hidden cursor-grab"
            onWheel={handleWheel}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            role="img"
            aria-label={alt || 'image preview'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || ''}
              className={cn('max-w-none select-none', scale === 1 && 'max-h-[80vh] object-contain')}
              style={{ transform: `translate(${origin.x}px, ${origin.y}px) scale(${scale})` }}
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
