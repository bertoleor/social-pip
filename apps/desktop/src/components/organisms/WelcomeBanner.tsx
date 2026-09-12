/**
 * U5.1: WelcomeBanner organism
 * Time-based greeting with Facebook-focused subtitle
 */
import { Card } from "@/components/molecules/Card";

export interface WelcomeBannerProps {
  userName?: string;
  className?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({ userName, className }: WelcomeBannerProps): React.ReactElement {
  const greeting = getGreeting();

  return (
    <Card className={className} padding="lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {greeting}
            {userName ? `, ${userName}` : ""}
          </h2>
          <p className="text-muted mt-1">
            Manage your Facebook presence and schedule content effortlessly.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary-600/10 flex items-center justify-center">
          <span className="text-2xl">📘</span>
        </div>
      </div>
    </Card>
  );
}
