/**
 * U7.2: PostPerformance organism
 * Section with placeholder chart and summary metrics
 */

import { Award, FileText, TrendingUp } from "lucide-react";
import { Card } from "@/components/molecules/Card";
import { MetricCard } from "@/components/molecules/MetricCard";

export function PostPerformance(): React.ReactElement {
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">Post Performance</h2>
      {/* Placeholder chart area */}
      <div className="w-full aspect-video border border-border rounded-lg flex items-center justify-center mb-4">
        <p className="text-sm text-muted">Chart will appear here</p>
      </div>
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard title="Total Posts" value={0} icon={FileText} />
        <MetricCard title="Avg. Engagement" value="0%" icon={TrendingUp} />
        <MetricCard title="Top Post" value="—" icon={Award} />
      </div>
    </Card>
  );
}
