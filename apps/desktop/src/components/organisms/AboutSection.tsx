/**
 * U6.4: AboutSection organism
 * App name, version, build info, links
 */
import { Card } from "@/components/molecules/Card";
import { ExternalLink } from "lucide-react";

export function AboutSection(): React.ReactElement {
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Application</p>
          <p className="text-sm font-medium text-foreground">Social-Pip</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Version</p>
          <p className="text-sm font-medium text-foreground">1.0.0</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Build</p>
          <p className="text-sm font-medium text-foreground">dev</p>
        </div>
        <div className="pt-2 border-t border-border space-y-2">
          <a
            href="https://github.com/gentleman-programming/social-pip"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            GitHub
          </a>
          <a
            href="https://github.com/gentleman-programming/social-pip/wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Documentation
          </a>
          <a
            href="https://github.com/gentleman-programming/social-pip/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Support
          </a>
        </div>
      </div>
    </Card>
  );
}
