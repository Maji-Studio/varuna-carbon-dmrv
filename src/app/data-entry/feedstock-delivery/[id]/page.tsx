import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getFeedstockDelivery } from "../actions";
import { FeedstockDeliveryForm } from "../feedstock-delivery-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFeedstockDeliveryPage({ params }: PageProps) {
  const { id } = await params;
  const [options, delivery] = await Promise.all([
    getFormOptions(),
    getFeedstockDelivery(id),
  ]);

  if (!delivery) {
    notFound();
  }

  return (
    <FeedstockDeliveryForm
      mode="edit"
      options={options}
      initialData={{
        id: delivery.id,
        facilityId: delivery.facilityId,
        deliveryDate: delivery.deliveryDate,
        supplierId: delivery.supplierId,
        driverId: delivery.driverId,
        vehicleType: delivery.vehicleType,
        fuelType: delivery.fuelType,
        fuelConsumedLiters: delivery.fuelConsumedLiters,
        notes: delivery.notes,
        supplier: delivery.supplier
          ? { location: delivery.supplier.location }
          : null,
      }}
    />
  );
}
