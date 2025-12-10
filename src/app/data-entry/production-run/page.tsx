import { getFormOptions } from "../actions";
import { ProductionRunForm } from "./production-run-form";

export const dynamic = "force-dynamic";

export default async function ProductionRunPage() {
  const options = await getFormOptions();

  return <ProductionRunForm mode="create" options={options} />;
}
