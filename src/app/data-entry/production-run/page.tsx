import { getFormOptions } from "../actions";
import { ProductionRunFormPage } from "./production-run-form-page";

export default async function ProductionRunPage() {
  const options = await getFormOptions();

  return <ProductionRunFormPage options={options} />;
}
