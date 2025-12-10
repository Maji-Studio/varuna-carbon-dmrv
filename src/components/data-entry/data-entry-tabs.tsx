"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntriesSection } from "./entries-section";
import type { IncompleteEntry } from "@/app/data-entry/actions";

interface DataEntryTabsProps {
  incompleteEntries: IncompleteEntry[];
  completedEntries: IncompleteEntry[];
}

export function DataEntryTabs({
  incompleteEntries,
  completedEntries,
}: DataEntryTabsProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <Tabs defaultValue="incomplete" className="flex flex-col gap-6">
        <TabsList>
          <TabsTrigger value="incomplete">
            Incomplete
            {incompleteEntries.length > 0 && (
              <span className="ml-1.5 rounded-md bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">
                {incompleteEntries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedEntries.length > 0 && (
              <span className="ml-1.5 rounded-md bg-green-500 px-1.5 py-0.5 text-xs font-medium text-white">
                {completedEntries.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomplete">
          <EntriesSection entries={incompleteEntries} variant="incomplete" />
        </TabsContent>
        <TabsContent value="completed">
          <EntriesSection entries={completedEntries} variant="completed" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
