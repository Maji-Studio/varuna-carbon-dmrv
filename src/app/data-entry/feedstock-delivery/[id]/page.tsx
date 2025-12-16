import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getFeedstockDelivery } from "../actions";
import { FeedstockDeliveryForm } from "../feedstock-delivery-form";

export const dynamic = "force-dynamic";

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
      options={{
        facilities: options.facilities,
        suppliers: options.suppliers,
        drivers: options.drivers,
        feedstockTypes: options.feedstockTypes,
        vehicles: options.vehicles,
      }}
      initialData={{
        id: delivery.id,
        facilityId: delivery.facilityId,
        deliveryDate: delivery.deliveryDate,
        supplierId: delivery.supplierId,
        driverId: delivery.driverId,
        vehicleId: delivery.vehicleId,
        vehicleType: delivery.vehicleType,
        fuelType: delivery.fuelType,
        distanceKm: delivery.distanceKm,
        fuelConsumedLiters: delivery.fuelConsumedLiters,
        feedstockTypeId: delivery.feedstockTypeId,
        weightKg: delivery.weightKg,
        moisturePercent: delivery.moisturePercent,
        notes: delivery.notes,
        supplier: delivery.supplier ? { location: delivery.supplier.location } : null,
        vehicle: delivery.vehicle ? {
          id: delivery.vehicle.id,
          name: delivery.vehicle.name,
          fuelType: delivery.vehicle.fuelType,
          fuelConsumptionLPerKm: delivery.vehicle.fuelConsumptionLPerKm,
        } : null,
      }}
    />
  );
}
