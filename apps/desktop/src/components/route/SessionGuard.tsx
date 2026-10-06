import { Loader2, ShieldAlert, WifiOff } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * SessionGuard — FR-10 route guard.
 *
 * Probes the Tauri backend session/connectivity on mount (fail-close). While the
 * probe is in flight it renders a loading state; on an unauth/session-expired or
 * unreachable backend it renders a session-required screen INSTEAD of the protected
 * page (never leaking the child UI). A successful probe renders <Outlet />.
 *
 * Usable as a layout route:
 *   <Route element={<SessionGuard />}>{protectedRoutes}</Route>
 */
export function SessionGuard(): ReactElement {
  const status = useSessionStore((state) => state.status);
  const error = useSessionStore((state) => state.error);
  const checkSession = useSessionStore((state) => state.checkSession);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (status === "checking") {
    return (
      <div
        data-testid="session-guard-loading"
        className="h-screen flex flex-col items-center justify-center gap-3 bg-background"
      >
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted">Checking session…</p>
      </div>
    );
  }

  if (status !== "connected") {
    const expired = status === "expired";
    const Icon = expired ? ShieldAlert : WifiOff;
    return (
      <div
        data-testid="session-required"
        className="h-screen flex flex-col items-center justify-center gap-4 px-6 bg-background text-center"
      >
        <Icon className="w-12 h-12 text-muted" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">
          {expired ? "Session required" : "Backend unreachable"}
        </h1>
        <p className="text-sm text-muted max-w-sm">
          {error ??
            (expired
              ? "Your session or credentials have expired. Re-authenticate to continue."
              : "Could not reach the Social-Pip backend. Check that it is running and retry.")}
        </p>
        <Button variant="primary" size="md" onClick={() => void checkSession()}>
          Retry
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
