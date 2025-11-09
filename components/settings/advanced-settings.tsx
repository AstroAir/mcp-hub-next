'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AdvancedSettings() {
  const t = useTranslations('settings.advanced');
  const { advanced, setAdvanced, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('experimental.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('experimental.description')}</p>
          </div>
          <Switch checked={advanced.experimentalFeatures} onCheckedChange={(v) => setAdvanced({ experimentalFeatures: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('devMode.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('devMode.description')}</p>
          </div>
          <Switch checked={advanced.devMode} onCheckedChange={(v) => setAdvanced({ devMode: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('advanced')}>{t('actions.reset')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
