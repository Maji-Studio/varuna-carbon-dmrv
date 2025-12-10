import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getSample, getProductionRunsForSampling } from "../actions";
import { SamplingForm } from "../sampling-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSamplingPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productionRuns, sample] = await Promise.all([
    getFormOptions(),
    getProductionRunsForSampling(),
    getSample(id),
  ]);

  if (!sample) {
    notFound();
  }

  return (
    <SamplingForm
      mode="edit"
      options={options}
      productionRuns={productionRuns}
      initialData={{
        id: sample.id,
        productionRunId: sample.productionRunId,
        samplingTime: sample.samplingTime,
        reactorId: sample.reactorId,
        operatorId: sample.operatorId,
        weightG: sample.weightG,
        volumeMl: sample.volumeMl,
        temperatureC: sample.temperatureC,
        moisturePercent: sample.moisturePercent,
        ashPercent: sample.ashPercent,
        volatileMatterPercent: sample.volatileMatterPercent,
        notes: sample.notes,
      }}
    />
  );
}
