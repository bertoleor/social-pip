/**
 * @fileoverview Main application entry point
 * Uses React Router v7 with lazy-loaded routes and MainLayout wrapper
 */
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

function App() {
	return <RouterProvider router={router} />;
}

export default App;
