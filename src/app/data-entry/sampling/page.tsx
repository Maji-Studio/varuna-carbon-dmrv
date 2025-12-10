import { getFormOptions } from "../actions";
import { getProductionRunsForSampling } from "./actions";
import { SamplingFormPage } from "./sampling-form-page";

export default async function SamplingPage() {
  const [options, productionRuns] = await Promise.all([
    getFormOptions(),
    getProductionRunsForSampling(),
  ]);

  return <SamplingFormPage options={options} productionRuns={productionRuns} />;
}
