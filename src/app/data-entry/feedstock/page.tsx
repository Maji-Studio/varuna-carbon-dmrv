import { getFormOptions } from "../actions";
import { FeedstockForm } from "./feedstock-form";

export const dynamic = "force-dynamic";

export default async function FeedstockPage() {
  const options = await getFormOptions();

  return <FeedstockForm mode="create" options={options} />;
}
