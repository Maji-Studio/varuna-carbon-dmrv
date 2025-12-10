import { getFormOptions } from "../actions";
import { getProductionRunsForIncident } from "./actions";
import { IncidentFormPage } from "./incident-form-page";

export default async function IncidentPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForIncident(),
  ]);

  return <IncidentFormPage options={options} productionRuns={productionRuns} />;
}
