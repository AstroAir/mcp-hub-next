"use client";

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { useChatStore } from '@/lib/stores';

export function PromptOptimizationToggle() {
  const { optimizePrompts, setOptimizePrompts } = useChatStore();
  return (
    <div className="flex items-center gap-2">
      <Switch id="optimizePrompts" checked={optimizePrompts} onCheckedChange={setOptimizePrompts} />
      <Label htmlFor="optimizePrompts" className="flex items-center gap-2 cursor-pointer text-xs md:text-sm">
        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        Optimize prompts
      </Label>
    </div>
  );
}
