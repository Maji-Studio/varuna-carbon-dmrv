import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getIncident, getProductionRunsForIncident } from "../actions";
import { IncidentForm } from "../incident-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditIncidentPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productionRuns, incident] = await Promise.all([
    getFormOptions(),
    getProductionRunsForIncident(),
    getIncident(id),
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
