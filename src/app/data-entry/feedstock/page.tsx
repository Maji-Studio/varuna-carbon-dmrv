import { getFormOptions } from "../actions";
import { FeedstockFormPage } from "./feedstock-form-page";

export default async function FeedstockPage() {
  const options = await getFormOptions();

  return <FeedstockFormPage options={options} />;
}
