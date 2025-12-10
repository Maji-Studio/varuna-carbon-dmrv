"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataEntryCardProps {
  title: string;
  description: string;
  href: string;
  className?: string;
}

export function DataEntryCard({
  title,
  description,
  href,
  className,
}: DataEntryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4",
        "hover:border-stone-300 hover:shadow-sm transition-all",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
        <Plus className="size-6 text-green-600" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
