import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { cn } from "@/lib/utils";
import type { Account, AccountStatus } from "@social-pip/types";
import { Edit2, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";

export interface AccountCardProps {
  account: Account;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const STATUS_VARIANTS: Record<AccountStatus, "success" | "neutral" | "info" | "warning" | "error"> =
  {
    active: "success",
    inactive: "neutral",
    warming_up: "info",
    restricted: "warning",
    banned: "error",
  };

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  warming_up: "Warming Up",
  restricted: "Restricted",
  banned: "Banned",
};

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onClick,
  className,
}: AccountCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit?.(account.id);
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete?.(account.id);
  };

  const handleClick = () => {
    onClick?.(account.id);
  };

  return (
    <article
      className={cn(
        "relative bg-white rounded-lg border border-gray-200 p-4",
        "transition-all duration-200",
        "hover:shadow-md",
        isHovered && "border-primary",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${account.name} - ${account.platform}`}
    >
      {/* Invisible button for card selection - handles keyboard navigation */}
      <button
        type="button"
        onClick={handleClick}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        aria-label={`Select ${account.name}`}
      />

      {/* Card content - relative to appear above the selection button */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <PlatformIcon platform={account.platform} size="lg" />

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{account.name}</h3>

              {account.username && (
                <p className="text-sm text-gray-500 line-clamp-1">@{account.username}</p>
              )}

              {account.displayName && account.displayName !== account.name && (
                <p className="text-xs text-gray-400 line-clamp-1">{account.displayName}</p>
              )}
            </div>
          </div>

          <Badge variant={STATUS_VARIANTS[account.status]} size="sm">
            {STATUS_LABELS[account.status]}
          </Badge>
        </div>
      </div>

      {/* Action buttons - relative and pointer-events-auto to be clickable */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-20"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            aria-label="Edit account"
            className="h-8 w-8 p-0 pointer-events-auto"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label="Delete account"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 pointer-events-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </article>
  );
}
