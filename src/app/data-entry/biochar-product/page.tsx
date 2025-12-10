import { getFormOptions } from "../actions";
import { getBiocharProductOptions } from "./options";
import { BiocharProductFormPage } from "./biochar-product-form-page";

export default async function BiocharProductPage() {
  const [options, productOptions] = await Promise.all([
    getFormOptions(),
    getBiocharProductOptions(),
  ]);

  return (
    <BiocharProductFormPage
      options={options}
      formulations={productOptions.formulations}
    />
  );
}
