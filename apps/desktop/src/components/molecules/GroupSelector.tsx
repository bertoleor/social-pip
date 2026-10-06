import { useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";

export interface GroupForSelection {
  id: string;
  name: string;
  memberCount: number | null;
  privacy: "public" | "private";
  lastPostedAt?: Date;
}

export interface GroupSelectorProps {
  groups: Array<GroupForSelection>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  disabled?: boolean;
}

function formatMemberCount(count: number | null): string {
  if (count === null) return "Unknown";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function GroupSelector({
  groups,
  selectedIds,
  onChange,
  className,
  disabled = false,
}: GroupSelectorProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const allFilteredSelected =
    filteredGroups.length > 0 && filteredGroups.every((g) => selectedIds.includes(g.id));

  const handleToggleGroup = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((gid) => gid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered groups
      const filteredIds = new Set(filteredGroups.map((g) => g.id));
      onChange(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered groups (unique)
      const newSelected = new Set([...selectedIds, ...filteredGroups.map((g) => g.id)]);
      onChange(Array.from(newSelected));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (groups.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>No groups available</div>
    );
  }

  return (
    <div className={cn("space-y-3", className, disabled && "opacity-50 pointer-events-none")}>
      {/* Header with search and bulk actions */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {allFilteredSelected ? "Deselect All" : "Select All"}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={disabled}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Clear All
        </button>
      </div>

      {/* Selection count */}
      {selectedIds.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedIds.length} {selectedIds.length === 1 ? "group" : "groups"} selected
        </div>
      )}

      {/* Group list */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No groups match your search</div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedIds.includes(group.id);
            return (
              <label
                key={group.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleGroup(group.id)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{group.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatMemberCount(group.memberCount)} members</span>
                    <Badge variant={group.privacy === "public" ? "success" : "neutral"} size="sm">
                      {group.privacy}
                    </Badge>
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
