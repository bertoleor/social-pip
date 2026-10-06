/**
 * @fileoverview Main application entry point
 * Uses React Router v7 with lazy-loaded routes and MainLayout wrapper
 * U2.4: Integrates useTheme for global theme synchronization
 */

import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { createAppRouter } from "./routes";

function App(): React.ReactElement {
  // Apply theme globally — synchronizes uiStore.theme to DOM
  useTheme();

  // Build the guarded router once (factory avoids a module-level browser-router
  // construction, keeping the route tree importable in tests without side effects).
  const router = useMemo(() => createAppRouter(), []);

  return <RouterProvider router={router} />;
}

export default App;
