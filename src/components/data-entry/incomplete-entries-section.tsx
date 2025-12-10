"use client";

import * as React from "react";
import { IncompleteEntryItem } from "./incomplete-entry-item";
import { Button } from "@/components/ui/button";
import type { IncompleteEntry } from "@/app/data-entry/actions";

const DEFAULT_VISIBLE_COUNT = 5;

interface IncompleteEntriesSectionProps {
  entries: IncompleteEntry[];
}

export function IncompleteEntriesSection({ entries }: IncompleteEntriesSectionProps) {
  const [showAll, setShowAll] = React.useState(false);
  const totalCount = entries.length;
  const hasMore = totalCount > DEFAULT_VISIBLE_COUNT;

  const visibleEntries = showAll ? entries : entries.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-stone-200 bg-white p-6">
      {/* Card Header */}
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-base font-medium text-foreground">
          Incomplete Data Entries
        </h2>
        {totalCount > 0 && (
          <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {totalCount}
          </span>
        )}
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
              missingCount={entry.missingCount}
              updatedAt={entry.updatedAt}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No incomplete entries. Great job!
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
