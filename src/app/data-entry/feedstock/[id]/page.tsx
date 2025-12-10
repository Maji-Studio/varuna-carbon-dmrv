import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getFeedstock } from "../actions";
import { FeedstockEditPage } from "./feedstock-edit-page";

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

  // Transform the feedstock data to match the expected type
  const feedstockData = {
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
    supplier: feedstock.supplier ? { location: feedstock.supplier.location } : undefined,
  };

  return <FeedstockEditPage options={options} feedstock={feedstockData} />;
}
