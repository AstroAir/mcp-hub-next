'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

const SUPPORTED = ['en', 'zh-CN'] as const;

export function LocaleSettings() {
  const t = useTranslations('settings.locale');
  const { locale, setLocale, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="locale">{t('fields.locale.label')}</Label>
          <Select value={locale.locale} onValueChange={setLocale}>
            <SelectTrigger id="locale">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED.map((value) => (
                <SelectItem key={value} value={value}>{t(`fields.locale.options.${value}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => resetSection('locale')}>{t('actions.reset')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
