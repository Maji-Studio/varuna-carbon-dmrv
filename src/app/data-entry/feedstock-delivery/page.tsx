import { getFormOptions } from "../actions";
import { FeedstockDeliveryForm } from "./feedstock-delivery-form";

export default async function FeedstockDeliveryPage() {
  const options = await getFormOptions();

  return <FeedstockDeliveryForm mode="create" options={options} />;
}
