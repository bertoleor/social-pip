import { SessionGuard } from "@/components/route/SessionGuard";
import { type RouteObject, createBrowserRouter } from "react-router-dom";

const DashboardPage = async () => ({
  Component: (await import("../pages/DashboardPage")).default,
});

const AccountsPage = async () => ({
  Component: (await import("../pages/AccountsPage")).default,
});

const PostsPage = async () => ({
  Component: (await import("../pages/PostsPage")).default,
});

const SchedulePage = async () => ({
  Component: (await import("../pages/SchedulePage")).default,
});

const AnalyticsPage = async () => ({
  Component: (await import("../pages/AnalyticsPage")).default,
});

const SettingsPage = async () => ({
  Component: (await import("../pages/SettingsPage")).default,
});

const NotFoundPage = async () => ({
  Component: (await import("../pages/NotFoundPage")).default,
});

/**
 * FR-10: every application route is nested under the SessionGuard layout route, so
 * unauthenticated / session-expired / unreachable backend fail-closes to a
 * session-required screen instead of leaking the protected page.
 */
export const routes: RouteObject[] = [
  {
    Component: SessionGuard,
    children: [
      { path: "/", lazy: DashboardPage },
      { path: "/accounts", lazy: AccountsPage },
      { path: "/posts", lazy: PostsPage },
      { path: "/schedule", lazy: SchedulePage },
      { path: "/analytics", lazy: AnalyticsPage },
      { path: "/settings", lazy: SettingsPage },
    ],
  },
  {
    path: "*",
    lazy: NotFoundPage,
  },
];

/**
 * Create the browser router from the guarded route tree. Kept as a factory (not a
 * module-level constant) so importing `routes` in tests is side-effect free and does
 * not construct a browser router against jsdom's AbortSignal (React Router 7).
 */
export function createAppRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(routes);
}
