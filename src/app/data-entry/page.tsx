import { getIncompleteEntries } from "./actions";
import { DataEntryCard, IncompleteEntryItem } from "@/components/data-entry";
import { Button } from "@/components/ui/button";

export default async function DataEntryPage() {
  const incompleteEntries = await getIncompleteEntries();
  const totalIncomplete = incompleteEntries.length;

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="flex flex-col gap-8 px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-base font-medium text-foreground">
            Dark Earth Carbon
          </h1>
          <div className="size-10 rounded-full bg-stone-300" />
        </header>

        {/* Data Entry Hub */}
        <div className="flex flex-col gap-6">
          {/* Incomplete Data Entries Card */}
          <div className="flex flex-col gap-6 rounded-xl border border-stone-200 bg-white p-6">
            {/* Card Header */}
            <div className="flex items-center gap-2">
              <h2 className="flex-1 text-base font-medium text-foreground">
                Incomplete Data Entries
              </h2>
              {totalIncomplete > 0 && (
                <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                  {totalIncomplete}
                </span>
              )}
            </div>

            {/* Entries List */}
            {incompleteEntries.length > 0 ? (
              <div className="flex flex-col gap-4">
                {incompleteEntries.map((entry) => (
                  <IncompleteEntryItem
                    key={`${entry.type}-${entry.id}`}
                    id={entry.id}
                    type={entry.type}
                    name={entry.name}
                    date={entry.date}
                    description={entry.description}
                    weight={entry.weight}
                    missingCount={entry.missingCount}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No incomplete entries. Great job!
              </p>
            )}

            {/* Show More Button */}
            {totalIncomplete > 0 && (
              <Button variant="outline" className="w-full">
                Show More
              </Button>
            )}
          </div>

          {/* Entry Point Cards Grid */}
          <div className="flex flex-col gap-2">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-2">
              <DataEntryCard
                title="Feedstock"
                description="Log incoming biomass batches for processing"
                href="/data-entry/feedstock"
              />
              <DataEntryCard
                title="Production Run"
                description="Record pyrolysis production runs and parameters"
                href="/data-entry/production-run"
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-2">
              <DataEntryCard
                title="Sampling"
                description="Record sampling data during production runs"
                href="/data-entry/sampling"
              />
              <DataEntryCard
                title="Incident Report"
                description="Record incidents during production runs"
                href="/data-entry/incident"
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-2">
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
