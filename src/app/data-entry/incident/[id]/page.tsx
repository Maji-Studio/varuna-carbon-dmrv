import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getIncidentFn } from "@/fn/incidents";
import { getProductionRunsForDropdown } from "@/lib/actions/utils";
import { IncidentForm } from "../incident-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditIncidentPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productionRuns, incident] = await Promise.all([
    getFormOptions(),
    getProductionRunsForDropdown(),
    getIncidentFn(id),
  ]);

  if (!incident) {
    notFound();
  }

  return (
    <IncidentForm
      mode="edit"
      options={options}
      productionRuns={productionRuns}
      initialData={{
        id: incident.id,
        productionRunId: incident.productionRunId,
        incidentTime: incident.incidentTime,
        reactorId: incident.reactorId,
        operatorId: incident.operatorId,
        notes: incident.notes,
      }}
    />
  );
}
