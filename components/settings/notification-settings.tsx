'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Bell } from 'lucide-react';

export function NotificationSettings() {
  const { notifications, setNotifications, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription>Control alerts and sound cues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Enable notifications</Label>
            <p className="text-xs text-muted-foreground">In-app toasts for important events</p>
          </div>
          <Switch checked={notifications.enabled} onCheckedChange={(v) => setNotifications({ enabled: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Play sound</Label>
            <p className="text-xs text-muted-foreground">Short chime when a notification appears</p>
          </div>
          <Switch checked={notifications.playSound} onCheckedChange={(v) => setNotifications({ playSound: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Show badges</Label>
            <p className="text-xs text-muted-foreground">Unread counters in sidebar</p>
          </div>
          <Switch checked={notifications.showBadges} onCheckedChange={(v) => setNotifications({ showBadges: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('notifications')}>Reset to defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
}
