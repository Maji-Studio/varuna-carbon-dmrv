import { getFormOptions } from "../actions";
import { getBiocharProductOptions } from "./options";
import { BiocharProductForm } from "./biochar-product-form";

export default async function BiocharProductPage() {
  const [options, productOptions] = await Promise.all([
    getFormOptions(),
    getBiocharProductOptions(),
  ]);

  return (
    <BiocharProductForm
      mode="create"
      options={options}
      formulations={productOptions.formulations}
    />
  );
}
