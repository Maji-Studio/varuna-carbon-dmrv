import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getProductionRunFn } from "@/fn/production-runs";
import { ProductionRunForm } from "../production-run-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductionRunPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productionRun] = await Promise.all([
    getFormOptions(),
    getProductionRunFn(id),
  ]);

  if (!productionRun) {
    notFound();
  }

  return (
    <ProductionRunForm
      mode="edit"
      options={options}
      initialData={productionRun}
    />
  );
}
