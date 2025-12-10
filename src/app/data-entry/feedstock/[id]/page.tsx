import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getFeedstock } from "../actions";
import { FeedstockForm } from "../feedstock-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFeedstockPage({ params }: PageProps) {
  const { id } = await params;
  const [options, feedstock] = await Promise.all([
    getFormOptions(),
    getFeedstock(id),
  ]);

  if (!feedstock) {
    notFound();
  }

  return (
    <FeedstockForm
      mode="edit"
      options={options}
      initialData={{
        id: feedstock.id,
        facilityId: feedstock.facilityId,
        date: feedstock.date,
        feedstockTypeId: feedstock.feedstockTypeId,
        supplierId: feedstock.supplierId,
        driverId: feedstock.driverId,
        vehicleType: feedstock.vehicleType,
        fuelConsumedLiters: feedstock.fuelConsumedLiters,
        weightKg: feedstock.weightKg,
        moisturePercent: feedstock.moisturePercent,
        storageLocationId: feedstock.storageLocationId,
        notes: feedstock.notes,
        supplier: feedstock.supplier
          ? { location: feedstock.supplier.location }
          : null,
      }}
    />
  );
}
