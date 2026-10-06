import { BarChart3, Eye, Heart, Share2 } from "lucide-react";
import { Skeleton } from "@/components/atoms/Skeleton";
/**
 * U7.4: Analytics Page Redesign
 * PostPerformance, MetricCards, AntiBanHealthCard, empty/loading states
 */
import { EmptyState } from "@/components/molecules/EmptyState";
import { MetricCard } from "@/components/molecules/MetricCard";
import { AntiBanHealthCard } from "@/components/organisms/AntiBanHealthCard";
import { PostPerformance } from "@/components/organisms/PostPerformance";
import { usePosts } from "@/hooks/usePosts";

export default function AnalyticsPage(): React.ReactElement {
  const { posts, loading } = usePosts();
  const hasPosts = posts.length > 0;

  if (loading) {
    return (
      <div data-testid="page-analytics" className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!hasPosts) {
    return (
      <div data-testid="page-analytics" className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Publish posts to see performance data"
        />
      </div>
    );
  }

  return (
    <div data-testid="page-analytics" className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted text-sm">View performance metrics and insights</p>
      </div>

      {/* Engagement Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Impressions"
          value="0"
          icon={Eye}
          change={{ value: 0, direction: "up" }}
        />
        <MetricCard
          title="Engagement Rate"
          value="0%"
          icon={Heart}
          change={{ value: 0, direction: "up" }}
        />
        <MetricCard
          title="Shares"
          value="0"
          icon={Share2}
          change={{ value: 0, direction: "down" }}
        />
      </div>

      {/* Post Performance */}
      <PostPerformance />

      {/* Anti-Ban Health */}
      <AntiBanHealthCard />
    </div>
  );
}
