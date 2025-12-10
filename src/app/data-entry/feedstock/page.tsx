import { getFormOptions } from "../actions";
import { FeedstockForm } from "./feedstock-form";

export default async function FeedstockPage() {
  const options = await getFormOptions();

  return <FeedstockForm mode="create" options={options} />;
}
