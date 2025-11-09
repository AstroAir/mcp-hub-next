'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NotificationSettings() {
  const t = useTranslations('settings.notifications');
  const { notifications, setNotifications, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.enabled.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.enabled.description')}</p>
          </div>
          <Switch checked={notifications.enabled} onCheckedChange={(v) => setNotifications({ enabled: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.playSound.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.playSound.description')}</p>
          </div>
          <Switch checked={notifications.playSound} onCheckedChange={(v) => setNotifications({ playSound: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">{t('toggles.showBadges.label')}</Label>
            <p className="text-xs text-muted-foreground">{t('toggles.showBadges.description')}</p>
          </div>
          <Switch checked={notifications.showBadges} onCheckedChange={(v) => setNotifications({ showBadges: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('notifications')}>{t('actions.reset')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
