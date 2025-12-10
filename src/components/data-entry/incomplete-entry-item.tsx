"use client";

import * as React from "react";
import Link from "next/link";
import { Wheat, Flame, Truck, Package, FlaskConical, AlertTriangle } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

type EntryType = "feedstock" | "production_run" | "feedstock_delivery" | "biochar_product" | "sampling" | "incident";

interface IncompleteEntryItemProps {
  id: string;
  type: EntryType;
  name: string;
  date: string;
  description?: string;
  weight?: string;
  missingCount: number;
  updatedAt: Date;
  className?: string;
  isCompleted?: boolean;
}

const typeConfig: Record<
  EntryType,
  { icon: React.ElementType; label: string; href: string }
> = {
  feedstock_delivery: {
    icon: Truck,
    label: "Feedstock Delivery",
    href: "/data-entry/feedstock-delivery",
  },
  feedstock: {
    icon: Wheat,
    label: "Feedstock",
    href: "/data-entry/feedstock",
  },
  production_run: {
    icon: Flame,
    label: "Production Run",
    href: "/data-entry/production-run",
  },
  biochar_product: {
    icon: Package,
    label: "Biochar Product",
    href: "/data-entry/biochar-product",
  },
  sampling: {
    icon: FlaskConical,
    label: "Sampling",
    href: "/data-entry/sampling",
  },
  incident: {
    icon: AlertTriangle,
    label: "Incident Report",
    href: "/data-entry/incident",
  },
};

export function IncompleteEntryItem({
  id,
  type,
  name,
  date,
  description,
  weight,
  missingCount,
  updatedAt,
  className,
  isCompleted = false,
}: IncompleteEntryItemProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Link
      href={`${config.href}/${id}`}
      className={cn(
        "flex flex-col gap-1 border-b border-stone-200/50 pb-4 last:border-0 last:pb-0",
        "hover:bg-stone-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {config.label}
          </span>
        </div>
        {isCompleted ? (
          <span className="shrink-0 rounded-lg bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">
            Complete
          </span>
        ) : (
          <span className="shrink-0 rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-900">
            {missingCount} missing
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {date}
          {description && ` • ${description}`}
        </span>
        {weight && <span className="shrink-0">{weight}</span>}
      </div>
      <div className="text-xs text-muted-foreground/70">
        {formatRelativeTime(updatedAt)}
      </div>
    </Link>
  );
}
