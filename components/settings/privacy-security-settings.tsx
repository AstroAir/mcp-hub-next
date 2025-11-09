'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PrivacySecuritySettings() {
  const t = useTranslations('settings.privacy');
  const { privacy, setPrivacy, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.telemetry.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.telemetry.description')}</p>
          </div>
          <Switch checked={privacy.telemetry} onCheckedChange={(v) => setPrivacy({ telemetry: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.crashReports.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.crashReports.description')}</p>
          </div>
          <Switch checked={privacy.crashReports} onCheckedChange={(v) => setPrivacy({ crashReports: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.requireConfirmOnClear.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.requireConfirmOnClear.description')}</p>
          </div>
          <Switch checked={privacy.requireConfirmOnClear} onCheckedChange={(v) => setPrivacy({ requireConfirmOnClear: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('privacy')}>{t('actions.reset')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
