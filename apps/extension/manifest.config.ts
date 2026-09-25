import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";

const { version } = packageJson;

// Convert from Semver (example: 1.0.0)
const [major, minor, patch, label = "0"] = version
  // can only contain digits, dots, or dash
  .replace(/[^Vd.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

export default defineManifest({
  manifest_version: 3,
  name: "Social-Pip Extension",
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  description: "Automatización de redes sociales - Browser automation para posting",
  // FR-03: `tabs` and `cookies` dropped. tab.url/sendMessage for the sole
  // active facebook tab is granted by host_permissions below; nothing reads
  // cookies (the cookie-based detect_current_profile RPC was removed).
  permissions: ["activeTab", "storage", "nativeMessaging"],
  host_permissions: ["*://*.facebook.com/*"],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["*://*.facebook.com/*"],
      js: ["src/content/facebook/index.ts"],
      run_at: "document_idle",
    },
  ],
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
  },
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
});
