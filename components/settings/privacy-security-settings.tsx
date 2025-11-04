'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Shield } from 'lucide-react';

export function PrivacySecuritySettings() {
  const { privacy, setPrivacy, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacy & Security
        </CardTitle>
        <CardDescription>Control what data is collected and sensitive operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Anonymous telemetry</Label>
            <p className="text-xs text-muted-foreground">Share usage to improve the product (no personal data)</p>
          </div>
          <Switch checked={privacy.telemetry} onCheckedChange={(v) => setPrivacy({ telemetry: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Crash reports</Label>
            <p className="text-xs text-muted-foreground">Send error details when something breaks</p>
          </div>
          <Switch checked={privacy.crashReports} onCheckedChange={(v) => setPrivacy({ crashReports: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Confirm before clearing data</Label>
            <p className="text-xs text-muted-foreground">Show an extra confirmation dialog</p>
          </div>
          <Switch checked={privacy.requireConfirmOnClear} onCheckedChange={(v) => setPrivacy({ requireConfirmOnClear: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('privacy')}>Reset to defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
}
