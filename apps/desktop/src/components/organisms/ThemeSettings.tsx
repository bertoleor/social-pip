/**
 * U6.1: ThemeSettings organism
 * Theme toggle buttons (Light/Dark/System) with active state indicator
 */
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";
import type { Theme } from "@/stores/uiStore";
import { useUIStore } from "@/stores/uiStore";

export function ThemeSettings(): React.ReactElement {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const options: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="Theme selection">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={theme === opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              theme === opt.value
                ? "border-primary-600 bg-primary-600/10 text-primary-600 dark:border-primary-400 dark:bg-primary-500/10 dark:text-primary-400"
                : "border-border text-foreground hover:border-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
