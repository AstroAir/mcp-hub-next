'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/lib/stores/settings-store';
import type { ColorScheme, FontScale, ThemeMode } from '@/lib/types';
import { Paintbrush, Type } from 'lucide-react';

export function AppearanceSettings() {
  const { appearance, setTheme, setColorScheme, setFontScale, resetSection } = useSettingsStore();

  const themeOptions: ThemeMode[] = ['system', 'light', 'dark'];
  const schemes: ColorScheme[] = ['zinc', 'slate', 'gray', 'neutral', 'stone', 'blue', 'violet', 'emerald', 'rose'];
  const fontScales: FontScale[] = ['sm', 'md', 'lg'];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5 text-primary" />
          Appearance
        </CardTitle>
        <CardDescription>Customize theme, colors, and font scale</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={appearance.theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheme">Color scheme</Label>
            <Select value={appearance.colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
              <SelectTrigger id="scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schemes.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-scale" className="flex items-center gap-2"><Type className="h-4 w-4" /> Font size</Label>
            <Select value={appearance.fontScale} onValueChange={(v) => setFontScale(v as FontScale)}>
              <SelectTrigger id="font-scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontScales.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => resetSection('appearance')}>Reset to defaults</Button>
              </TooltipTrigger>
              <TooltipContent>Restore default theme and sizes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
