'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Sparkles } from 'lucide-react';

export function AdvancedSettings() {
  const { advanced, setAdvanced, resetSection } = useSettingsStore();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Advanced
        </CardTitle>
        <CardDescription>Experimental options and developer mode</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Experimental features</Label>
            <p className="text-xs text-muted-foreground">Try new features before they’re stable</p>
          </div>
          <Switch checked={advanced.experimentalFeatures} onCheckedChange={(v) => setAdvanced({ experimentalFeatures: v })} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="cursor-pointer">Developer mode</Label>
            <p className="text-xs text-muted-foreground">Show debug panels and extra logs</p>
          </div>
          <Switch checked={advanced.devMode} onCheckedChange={(v) => setAdvanced({ devMode: v })} />
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => resetSection('advanced')}>Reset to defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
}
