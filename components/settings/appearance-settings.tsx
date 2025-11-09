'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/lib/stores/settings-store';
import type { ColorScheme, FontScale, ThemeMode } from '@/lib/types';
import { Paintbrush, Type } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AppearanceSettings() {
  const t = useTranslations('settings.appearance');
  const { appearance, setTheme, setColorScheme, setFontScale, resetSection } = useSettingsStore();

  const themeOptions: ThemeMode[] = ['system', 'light', 'dark'];
  const schemes: ColorScheme[] = ['zinc', 'slate', 'gray', 'neutral', 'stone', 'blue', 'violet', 'emerald', 'rose'];
  const fontScales: FontScale[] = ['sm', 'md', 'lg'];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="theme">{t('fields.theme.label')}</Label>
            <Select value={appearance.theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option} value={option}>{t(`fields.theme.options.${option}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheme">{t('fields.colorScheme.label')}</Label>
            <Select value={appearance.colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
              <SelectTrigger id="scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schemes.map((scheme) => (
                  <SelectItem key={scheme} value={scheme}>{t(`fields.colorScheme.options.${scheme}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-scale" className="flex items-center gap-2"><Type className="h-4 w-4" /> {t('fields.fontScale.label')}</Label>
            <Select value={appearance.fontScale} onValueChange={(v) => setFontScale(v as FontScale)}>
              <SelectTrigger id="font-scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontScales.map((scale) => (
                  <SelectItem key={scale} value={scale}>
                    {t(`fields.fontScale.options.${scale}`)}
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
                <Button variant="outline" onClick={() => resetSection('appearance')}>{t('actions.reset')}</Button>
              </TooltipTrigger>
              <TooltipContent>{t('actions.tooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
