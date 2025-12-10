import { getFormOptions } from "../actions";
import { getProductionRunsForSampling } from "./actions";
import { SamplingForm } from "./sampling-form";

export const dynamic = "force-dynamic";

export default async function SamplingPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForSampling(),
  ]);

  return (
    <SamplingForm
      mode="create"
      options={options}
      productionRuns={productionRuns}
    />
  );
}
