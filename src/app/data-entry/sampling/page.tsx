import { getFormOptions } from "../actions";
import { getProductionRunsForDropdown } from "@/lib/actions/utils";
import { SamplingForm } from "./sampling-form";

export const dynamic = "force-dynamic";

export default async function SamplingPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForDropdown(),
  ]);

  return (
    <SamplingForm
      mode="create"
      options={options}
      productionRuns={productionRuns}
    />
  );
}
