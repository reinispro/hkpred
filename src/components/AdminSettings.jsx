
    import React, { useState, useEffect } from 'react';
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Label } from '@/components/ui/label';
    import { Switch } from '@/components/ui/switch';

    const AdminSettings = () => {
      const { appSettings: globalAppSettings } = useSupabaseAuth();
      const [settings, setSettings] = useState(null);
      const { toast } = useToast();

      useEffect(() => {
        if (globalAppSettings) {
          setSettings(JSON.parse(JSON.stringify(globalAppSettings)));
        }
      }, [globalAppSettings]);

      const handleSettingToggle = async (settingName) => {
        if (!settings || !settings[settingName]) return;

        const currentSetting = settings[settingName];
        const newEnabledState = !currentSetting.is_enabled;

        // Optimistic UI update
        setSettings(prev => ({
          ...prev,
          [settingName]: { ...prev[settingName], is_enabled: newEnabledState }
        }));

        const { error } = await supabase
          .from('app_settings')
          .update({ is_enabled: newEnabledState })
          .eq('id', currentSetting.id);

        if (error) {
          toast({ variant: 'destructive', title: 'Error updating setting', description: error.message });
          // Revert on error
          setSettings(globalAppSettings);
        } else {
          toast({ title: 'Success', description: 'Setting updated successfully.' });
        }
      };

      if (!settings) {
        return <div className="text-white p-4">Loading settings...</div>;
      }

      return (
        <Card className="glass-card text-white">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription className="text-white/70">Configure special rules and features. Changes are saved in real-time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
              <div>
                <Label htmlFor="always-show-predictions" className="text-lg font-medium">Always Show Predictions</Label>
                <p className="text-sm text-white/70">If enabled, users can see others' predictions for all games, even before they start. (Used for finals)</p>
              </div>
              <Switch
                id="always-show-predictions"
                checked={settings.always_show_predictions?.is_enabled || false}
                onCheckedChange={() => handleSettingToggle('always_show_predictions')}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
              <div>
                <Label htmlFor="special-lock-time" className="text-lg font-medium">Special Lock Times</Label>
                <p className="text-sm text-white/70">If enabled, top 3 players have different prediction lock times (1st: 1h, 2nd: 45m, 3rd: 30m before game).</p>
              </div>
              <Switch
                id="special-lock-time"
                checked={settings.special_lock_time?.is_enabled || false}
                onCheckedChange={() => handleSettingToggle('special_lock_time')}
              />
            </div>
          </CardContent>
        </Card>
      );
    };

    export default AdminSettings;
  