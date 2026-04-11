import { AntiBanDashboard } from "@/components/organisms/AntiBanDashboard";
import { MonitoringDashboard } from "@/components/organisms/MonitoringDashboard";

export default function DashboardPage(): React.ReactElement {
  return (
    <div data-testid="page-dashboard" className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Social-Pip. Overview of your social media activity.
        </p>
      </div>

      <div>
        <MonitoringDashboard />
      </div>

      <div>
        <AntiBanDashboard defaultPlatform="facebook" />
      </div>
    </div>
  );
}
