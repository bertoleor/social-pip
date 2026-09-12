/**
 * @fileoverview Main application entry point
 * Uses React Router v7 with lazy-loaded routes and MainLayout wrapper
 * U2.4: Integrates useTheme for global theme synchronization
 */
import { useTheme } from "@/hooks/useTheme";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

function App(): React.ReactElement {
  // Apply theme globally — synchronizes uiStore.theme to DOM
  useTheme();

  return <RouterProvider router={router} />;
}

export default App;
