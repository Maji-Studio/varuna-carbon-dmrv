"use client";

import * as React from "react";
import { IncompleteEntryItem } from "./incomplete-entry-item";
import { Button } from "@/components/ui/button";
import type { IncompleteEntry } from "@/app/data-entry/actions";

const DEFAULT_VISIBLE_COUNT = 5;

interface EntriesSectionProps {
  entries: IncompleteEntry[];
  variant: "incomplete" | "completed";
}

export function EntriesSection({ entries, variant }: EntriesSectionProps) {
  const [showAll, setShowAll] = React.useState(false);
  const totalCount = entries.length;
  const hasMore = totalCount > DEFAULT_VISIBLE_COUNT;

  const visibleEntries = showAll ? entries : entries.slice(0, DEFAULT_VISIBLE_COUNT);
  const isCompleted = variant === "completed";

  return (
    <div className="flex flex-col gap-4">
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
              missingCount={entry.missingCount}
              updatedAt={entry.updatedAt}
              isCompleted={isCompleted}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          {isCompleted
            ? "No completed entries yet."
            : "No incomplete entries. Great job!"}
        </p>
      )}

      {/* Show All Button - only when more than 5 entries */}
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
