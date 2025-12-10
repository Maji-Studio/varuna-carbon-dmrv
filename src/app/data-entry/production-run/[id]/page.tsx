import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getProductionRun } from "../actions";
import { ProductionRunEditPage } from "./production-run-edit-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductionRunPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productionRun] = await Promise.all([
    getFormOptions(),
    getProductionRun(id),
  ]);

  if (!productionRun) {
    notFound();
  }

  return <ProductionRunEditPage options={options} productionRun={productionRun} />;
}
