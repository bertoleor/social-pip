import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import {
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ToastContainer } from "../molecules/ToastContainer";

export interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function MainLayout({
  children,
  title,
  className,
}: MainLayoutProps): React.ReactElement {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/accounts", label: "Accounts", icon: Users },
    { to: "/posts", label: "Posts", icon: FileText },
    { to: "/schedule", label: "Schedule", icon: Calendar },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn("h-screen flex bg-gray-50", className)}>
      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        className={cn(
          "h-full bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-64" : "w-0",
        )}
      >
        <div
          className={cn("w-64 h-full flex flex-col", !sidebarOpen && "hidden")}
        >
          {/* Sidebar header */}
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Social-Pip</h1>
          </div>

          {/* Navigation items */}
          <div className="flex-1 py-4 px-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-100",
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
