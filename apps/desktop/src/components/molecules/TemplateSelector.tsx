import type { Template } from "@social-pip/types";
import { useState } from "react";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";

export interface TemplateSelectorProps {
  templates: Template[];
  onSelect?: (template: Template) => void;
  className?: string;
}

export function TemplateSelector({
  templates,
  onSelect,
  className,
}: TemplateSelectorProps): React.ReactElement {
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sectors = Array.from(new Set(templates.map((t) => t.sector)));

  const filteredTemplates =
    sectorFilter === "all" ? templates : templates.filter((t) => t.sector === sectorFilter);

  if (templates.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>No templates available</div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {sectors.length > 1 && (
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
          aria-label="Filter by sector"
        >
          <option value="all">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect?.(template)}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm">{template.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{template.sector}</span>
              </div>

              <div className="flex gap-1">
                {template.platforms.map((platform) => (
                  <PlatformIcon key={platform} platform={platform} size="sm" />
                ))}
              </div>

              {hoveredId === template.id && (
                <p className="text-xs text-gray-600 line-clamp-3">{template.content}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
