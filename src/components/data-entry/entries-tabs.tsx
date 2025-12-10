"use client";

import * as React from "react";
import { IncompleteEntryItem } from "./incomplete-entry-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IncompleteEntry, CompletedEntry } from "@/app/data-entry/actions";

const DEFAULT_VISIBLE_COUNT = 5;

interface EntriesTabsProps {
  incompleteEntries: IncompleteEntry[];
  completedEntries: CompletedEntry[];
}

type TabType = "incomplete" | "completed";

export function EntriesTabs({ incompleteEntries, completedEntries }: EntriesTabsProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("incomplete");
  const [showAll, setShowAll] = React.useState(false);

  const entries = activeTab === "incomplete" ? incompleteEntries : completedEntries;
  const totalCount = entries.length;
  const hasMore = totalCount > DEFAULT_VISIBLE_COUNT;
  const visibleEntries = showAll ? entries : entries.slice(0, DEFAULT_VISIBLE_COUNT);

  // Reset showAll when switching tabs
  React.useEffect(() => {
    setShowAll(false);
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-stone-200 bg-white p-6">
      {/* Tab Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-lg bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("incomplete")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "incomplete"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Incomplete
            {incompleteEntries.length > 0 && (
              <span className="ml-1.5 rounded bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {incompleteEntries.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "completed"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Completed
            {completedEntries.length > 0 && (
              <span className="ml-1.5 rounded bg-green-500 px-1.5 py-0.5 text-xs text-white">
                {completedEntries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 ? (
        <div className="flex flex-col gap-4">
          {visibleEntries.map((entry) => (
            <IncompleteEntryItem
              key={`${entry.type}-${entry.id}`}
              id={entry.id}
              type={entry.type}
              name={entry.name}
              date={entry.date}
              description={entry.description}
              weight={entry.weight}
              missingCount={activeTab === "incomplete" ? (entry as IncompleteEntry).missingCount : 0}
              updatedAt={activeTab === "incomplete" ? (entry as IncompleteEntry).updatedAt : (entry as CompletedEntry).completedAt}
              isCompleted={activeTab === "completed"}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {activeTab === "incomplete"
            ? "No incomplete entries. Great job!"
            : "No completed entries yet."}
        </p>
      )}

      {/* Show All Button */}
      {hasMore && !showAll && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Show All ({totalCount})
        </Button>
      )}
    </div>
  );
}
