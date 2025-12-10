import { getIncompleteEntries, getCompletedEntries } from "./actions";
import { DataEntryCard, DataEntryTabs } from "@/components/data-entry";

export default async function DataEntryPage() {
  const [incompleteEntries, completedEntries] = await Promise.all([
    getIncompleteEntries(),
    getCompletedEntries(),
  ]);

  return (
    <div className="min-h-screen max-w-2xl mx-auto bg-neutral-50">
      <div className="flex flex-col gap-8 px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-base font-medium text-foreground">Dark Earth Carbon</h1>
          <div className="size-10 rounded-full bg-stone-300" />
        </header>

        {/* Data Entry Hub */}
        <div className="flex flex-col gap-6">
          {/* Tabbed Entries */}
          <DataEntryTabs
            incompleteEntries={incompleteEntries}
            completedEntries={completedEntries}
          />

          {/* Entry Point Cards Grid */}
          <div className="flex flex-col gap-2">
            {/* Row 1: Delivery & Feedstock */}
            <div className="grid grid-cols-2 gap-2">
              <DataEntryCard
                title="Feedstock Delivery"
                description="Record incoming feedstock deliveries and transport"
                href="/data-entry/feedstock-delivery"
              />
              <DataEntryCard
                title="Feedstock"
                description="Log incoming biomass batches for processing"
                href="/data-entry/feedstock"
              />
            </div>

            {/* Row 2: Production & Sampling */}
            <div className="grid grid-cols-2 gap-2">
              <DataEntryCard
                title="Production Run"
                description="Record pyrolysis production runs and parameters"
                href="/data-entry/production-run"
              />
              <DataEntryCard
                title="Sampling"
                description="Record sampling data during production runs"
                href="/data-entry/sampling"
              />
            </div>

            {/* Row 3: Incident & Biochar */}
            <div className="grid grid-cols-2 gap-2">
              <DataEntryCard
                title="Incident Report"
                description="Record incidents during production runs"
                href="/data-entry/incident"
              />
              <DataEntryCard
                title="Biochar Product"
                description="Document biochar batches and quality metrics"
                href="/data-entry/biochar-product"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
