/**
 * U6.2: AccountManagement organism
 * List of connected Facebook accounts with disconnect action
 */

import { Users } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useAccountsStore } from "@/stores/accountsStore";

export function AccountManagement(): React.ReactElement {
  const { accounts } = useAccountsStore();

  if (accounts.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">Accounts</h2>
        <EmptyState
          icon={Users}
          title="No accounts connected"
          description="Connect your Facebook account to start posting"
          action={{ label: "Connect Account", onClick: () => {} }}
        />
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">Accounts</h2>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs font-bold text-accent">FB</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{account.name}</p>
                <p className="text-xs text-muted">{account.platform}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Disconnect
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
