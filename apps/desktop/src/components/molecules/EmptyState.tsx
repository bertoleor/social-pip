/**
 * U3.6: EmptyState molecule component
 * Centered empty state with icon, title, description, and optional CTA
 */

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      <Icon
        data-testid="empty-state-icon"
        className="w-12 h-12 text-muted mb-4"
        aria-hidden="true"
      />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
