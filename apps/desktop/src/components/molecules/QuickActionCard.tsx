/**
 * U5.2: QuickActionCard molecule
 * Clickable card with icon, title, description
 */
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default";
  className?: string;
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "default",
  className,
}: QuickActionCardProps): React.ReactElement {
  return (
    <Card
      hoverable
      padding="md"
      shadow="sm"
      className={cn(
        "cursor-pointer",
        variant === "primary" && "border-accent/30 hover:border-accent/60",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            variant === "primary"
              ? "bg-accent/10 text-accent"
              : "bg-primary-600/10 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <p className="text-muted text-xs mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}
