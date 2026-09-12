/**
 * U7.3: AntiBanHealthCard organism
 * Health score, status, recent violations, recommendations
 */
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";

export interface AntiBanHealthCardProps {
  score?: number;
  className?: string;
}

function getStatus(score: number): { label: string; variant: "success" | "warning" | "error" } {
  if (score >= 80) return { label: "Healthy", variant: "success" };
  if (score >= 50) return { label: "Warning", variant: "warning" };
  return { label: "Critical", variant: "error" };
}

export function AntiBanHealthCard({
  score = 85,
  className,
}: AntiBanHealthCardProps): React.ReactElement {
  const status = getStatus(score);

  return (
    <Card padding="lg" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Anti-Ban Health</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
            score >= 80
              ? "bg-success/10 text-success"
              : score >= 50
                ? "bg-warning/10 text-warning"
                : "bg-error/10 text-error",
          )}
        >
          {score}
        </div>
        <div>
          <p className="text-sm text-muted">Health Score</p>
          <p className="text-xs text-muted mt-1">Based on recent activity patterns</p>
        </div>
      </div>

      {/* Recent violations (placeholder) */}
      <div className="border-t border-border pt-3">
        <p className="text-sm font-medium text-foreground mb-2">Recent Activity</p>
        <p className="text-xs text-muted">No violations in the last 24 hours</p>
      </div>

      {/* Recommendations */}
      <div className="border-t border-border pt-3 mt-3">
        <p className="text-sm font-medium text-foreground mb-2">Recommendations</p>
        <ul className="space-y-1">
          <li className="text-xs text-muted">• Maintain consistent posting intervals</li>
          <li className="text-xs text-muted">• Avoid rapid sequential actions</li>
          <li className="text-xs text-muted">• Use varied content patterns</li>
        </ul>
      </div>
    </Card>
  );
}
