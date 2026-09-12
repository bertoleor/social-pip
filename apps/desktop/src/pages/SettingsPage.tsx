/**
 * U6.5: Settings Page Redesign
 * ThemeSettings, AccountManagement, AI Config, AppPreferences, About
 */
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { AboutSection } from "@/components/organisms/AboutSection";
import { AccountManagement } from "@/components/organisms/AccountManagement";
import { AppPreferences } from "@/components/organisms/AppPreferences";
import { ThemeSettings } from "@/components/organisms/ThemeSettings";
import { useSettings } from "@/hooks/useSettings";
import type { AIProvider } from "@social-pip/types";
import { Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage(): React.ReactElement {
  const { settings, loading, error, updateSettings, updateAIConfig, toggleAntiBan } = useSettings();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<AIProvider>("nim");

  if (loading) {
    return (
      <div data-testid="page-settings" className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted/40 rounded" />
          <div className="h-64 w-full bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div data-testid="page-settings" className="p-6">
        <p className="text-error">Error loading settings: {error}</p>
      </div>
    );
  }

  const handleSaveAIConfig = async () => {
    await updateAIConfig({ provider, apiKey });
  };

  return (
    <div data-testid="page-settings" className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted text-sm">Configure application settings and preferences</p>
      </div>

      {/* Theme Settings */}
      <ThemeSettings />

      {/* Account Management */}
      <AccountManagement />

      {/* AI Configuration */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">AI Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-foreground mb-1">
              Provider
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="nim">NVIDIA NIM</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-foreground mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-surface text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                placeholder="Enter your API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted" />
                ) : (
                  <Eye className="h-4 w-4 text-muted" />
                )}
              </button>
            </div>
          </div>

          <Button onClick={handleSaveAIConfig} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save AI Configuration
          </Button>
        </div>
      </Card>

      {/* Anti-Ban Settings */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">Anti-Ban Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Enable Anti-Ban</p>
              <p className="text-sm text-muted">Automatically add delays and randomization</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.antiBanEnabled ?? true}
                onChange={(e) => toggleAntiBan(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Strict Mode</p>
              <p className="text-sm text-muted">Extra cautious with longer delays</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.antiBanStrictMode ?? false}
                onChange={(e) => updateSettings({ antiBanStrictMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>
        </div>
      </Card>

      {/* App Preferences */}
      <AppPreferences />

      {/* About */}
      <AboutSection />
    </div>
  );
}
