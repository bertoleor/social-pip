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

export const routes: RouteObject[] = [
  {
    path: "/",
    lazy: DashboardPage,
  },
  {
    path: "/accounts",
    lazy: AccountsPage,
  },
  {
    path: "/posts",
    lazy: PostsPage,
  },
  {
    path: "/schedule",
    lazy: SchedulePage,
  },
  {
    path: "/analytics",
    lazy: AnalyticsPage,
  },
  {
    path: "/settings",
    lazy: SettingsPage,
  },
  {
    path: "*",
    lazy: NotFoundPage,
  },
];

export const router = createBrowserRouter(routes);
