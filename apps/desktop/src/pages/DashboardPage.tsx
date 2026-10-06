/**
 * U5.3 + U5.4: Dashboard Page Redesign
 * WelcomeBanner, Quick Actions, Anti-Ban, Monitoring with empty states
 */

import { BarChart3, Calendar, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/molecules/EmptyState";
import { QuickActionCard } from "@/components/molecules/QuickActionCard";
import { AntiBanDashboard } from "@/components/organisms/AntiBanDashboard";
import { MonitoringDashboard } from "@/components/organisms/MonitoringDashboard";
import { WelcomeBanner } from "@/components/organisms/WelcomeBanner";
import { useAccountsStore } from "@/stores/accountsStore";

export default function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const { accounts } = useAccountsStore();
  const hasAccounts = accounts.length > 0;

  return (
    <div data-testid="page-dashboard" className="p-6 space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={FileText}
          title="Create Post"
          description="Write and schedule a new Facebook post"
          onClick={() => navigate("/posts")}
          variant="primary"
        />
        <QuickActionCard
          icon={Calendar}
          title="View Schedule"
          description="Check your upcoming scheduled posts"
          onClick={() => navigate("/schedule")}
        />
        <QuickActionCard
          icon={BarChart3}
          title="Check Analytics"
          description="Review your post performance metrics"
          onClick={() => navigate("/analytics")}
        />
      </div>

      {/* Anti-Ban Summary */}
      {hasAccounts ? (
        <div>
          <AntiBanDashboard defaultPlatform="facebook" />
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No accounts connected"
          description="Connect your Facebook account to see anti-ban stats and start posting safely"
          action={{ label: "Connect Account", onClick: () => navigate("/accounts") }}
        />
      )}

      {/* Monitoring Summary */}
      {hasAccounts ? (
        <div>
          <MonitoringDashboard />
        </div>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="No monitoring data"
          description="Connect an account to monitor your posting activity"
        />
      )}
    </div>
  );
}
