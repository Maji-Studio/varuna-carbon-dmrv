import { notFound } from "next/navigation";
import { getFormOptions } from "../../actions";
import { getBiocharProduct } from "../actions";
import { getBiocharProductOptions } from "../options";
import { BiocharProductForm } from "../biochar-product-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBiocharProductPage({ params }: PageProps) {
  const { id } = await params;
  const [options, productOptions, product] = await Promise.all([
    getFormOptions(),
    getBiocharProductOptions(),
    getBiocharProduct(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <BiocharProductForm
      mode="edit"
      options={options}
      formulations={productOptions.formulations}
      initialData={{
        id: product.id,
        facilityId: product.facilityId,
        productionDate: product.productionDate,
        formulationId: product.formulationId,
        totalWeightKg: product.totalWeightKg,
        totalVolumeLiters: product.totalVolumeLiters,
        storageLocationId: product.storageLocationId,
        biocharSourceStorageId: product.biocharSourceStorageId,
        biocharAmountKg: product.biocharAmountKg,
        biocharPerM3Kg: product.biocharPerM3Kg,
        compostWeightKg: product.compostWeightKg,
        compostPerM3Kg: product.compostPerM3Kg,
      }}
    />
  );
}
