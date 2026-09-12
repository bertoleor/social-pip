/**
 * U6.3: AppPreferences organism
 * Settings for auto-start, minimize to tray, notifications, language
 */
import { Card } from "@/components/molecules/Card";
import { useSettings } from "@/hooks/useSettings";

export function AppPreferences(): React.ReactElement {
  const { settings, updateSettings } = useSettings();

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Auto-start on boot</p>
            <p className="text-sm text-muted">Launch Social-Pip when your computer starts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.autoStart ?? false}
              onChange={(e) => updateSettings({ autoStart: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable Notifications</p>
            <p className="text-sm text-muted">Receive notifications for task completions</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.notificationsEnabled ?? true}
              onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Sound Effects</p>
            <p className="text-sm text-muted">Play sounds for notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.soundEnabled ?? true}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>
      </div>
    </Card>
  );
}
