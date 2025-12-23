import { getFormOptions } from "../actions";
import { getProductionRunsForDropdown } from "@/lib/actions/utils";
import { IncidentForm } from "./incident-form";

export const dynamic = "force-dynamic";

export default async function IncidentPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForDropdown(),
  ]);

  return (
    <IncidentForm
      mode="create"
      options={options}
      productionRuns={productionRuns}
    />
  );
}
