/**
 * U4: Layout Redesign — Sidebar icon-rail collapse, active indicator,
 * brand header, theme toggle
 */
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Monitor,
  Moon,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ToastContainer } from "../molecules/ToastContainer";

export interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/posts", label: "Posts", icon: FileText },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const themeCycle: Record<string, "light" | "dark" | "system"> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function MainLayout({ children, title, className }: MainLayoutProps): React.ReactElement {
  const { sidebarCollapsed, setSidebarCollapsed, theme, setTheme } = useUIStore();
  const location = useLocation();

  const ThemeIcon = themeIcons[theme];

  return (
    <div className={cn("h-screen flex bg-background", className)}>
      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        className={cn(
          "h-full bg-surface border-r border-border transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-border shrink-0",
            sidebarCollapsed ? "justify-center px-2" : "px-4",
          )}
        >
          {sidebarCollapsed ? (
            <LayoutDashboard className="w-6 h-6 text-primary-600" aria-label="Social-Pip" />
          ) : (
            <h1 className="text-lg font-semibold text-foreground">Social-Pip</h1>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    sidebarCollapsed && "justify-center px-0",
                    isActive
                      ? "bg-primary-600/10 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 border-l-2 border-primary-600 dark:border-primary-400"
                      : "text-foreground hover:bg-muted/50 dark:hover:bg-muted/30",
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom section: theme toggle + collapse */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(themeCycle[theme] ?? "light")}
            aria-label={`Switch theme, current: ${theme}`}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-foreground hover:bg-muted/50 dark:hover:bg-muted/30",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            <ThemeIcon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="capitalize">{theme}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-foreground hover:bg-muted/50 dark:hover:bg-muted/30",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-surface border-b border-border">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
