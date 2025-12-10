import { getFormOptions } from "../actions";
import { getProductionRunsForIncident } from "./actions";
import { IncidentForm } from "./incident-form";

export const dynamic = "force-dynamic";

export default async function IncidentPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForIncident(),
  ]);

  return (
    <IncidentForm
      mode="create"
      options={options}
      productionRuns={productionRuns}
    />
  );
}
