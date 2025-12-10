import { getFormOptions } from "../actions";
import { FeedstockDeliveryForm } from "./feedstock-delivery-form";

export const dynamic = "force-dynamic";

export default async function FeedstockDeliveryPage() {
  const options = await getFormOptions();

  return <FeedstockDeliveryForm mode="create" options={options} />;
}
