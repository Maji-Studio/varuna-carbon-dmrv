"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createBiocharProduct, updateBiocharProduct, deleteBiocharProduct } from "./actions";
import { isBiocharProductComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

interface BiocharProductData {
  id: string;
  facilityId: string;
  productionDate: Date | null;
  formulationId: string | null;
  totalWeightKg: number | null;
  totalVolumeLiters: number | null;
  storageLocationId: string | null;
  biocharSourceStorageId: string | null;
  biocharAmountKg: number | null;
  biocharPerM3Kg: number | null;
  compostWeightKg: number | null;
  compostPerM3Kg: number | null;
  notes?: string | null;
}

interface BiocharProductFormProps {
  mode: "create" | "edit";
  initialData?: BiocharProductData;
  options: {
    facilities: SelectOption[];
    storageLocations: SelectOption[];
  };
  formulations: SelectOption[];
}

export function BiocharProductForm({
  mode,
  initialData,
  options,
  formulations,
}: BiocharProductFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      facilityId: initialData?.facilityId ?? "",
      productionDate: initialData?.productionDate ?? new Date(),
      formulationId: initialData?.formulationId ?? "",
      totalWeightKg: initialData?.totalWeightKg ?? undefined,
      totalVolumeLiters: initialData?.totalVolumeLiters ?? undefined,
      storageLocationId: initialData?.storageLocationId ?? "",
      biocharSourceStorageId: initialData?.biocharSourceStorageId ?? "",
      biocharAmountKg: initialData?.biocharAmountKg ?? undefined,
      biocharPerM3Kg: initialData?.biocharPerM3Kg ?? undefined,
      compostWeightKg: initialData?.compostWeightKg ?? undefined,
      compostPerM3Kg: initialData?.compostPerM3Kg ?? undefined,
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isBiocharProductComplete(value);

      const result = isEdit && initialData
        ? await updateBiocharProduct(initialData.id, value)
        : await createBiocharProduct(value);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Biochar product completed"
          : isEdit
            ? "Draft updated"
            : "Draft saved"
      );
      router.refresh();
      router.push("/data-entry");
    },
  });

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    const result = await deleteBiocharProduct(initialData.id);
    if (!result.success) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Biochar product deleted");
    router.refresh();
    router.push("/data-entry");
  };

  // Filter storage locations
  const biocharStorageLocations = React.useMemo(
    () =>
      options.storageLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes("biochar") ||
          loc.name.toLowerCase().includes("pile")
      ),
    [options.storageLocations]
  );
  const productStorageLocations = React.useMemo(
    () =>
      options.storageLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes("product") ||
          loc.name.toLowerCase().includes("pile")
      ),
    [options.storageLocations]
  );

  // Memoized options
  const facilityOptions = React.useMemo(
    () => options.facilities.map((f) => ({ value: f.id, label: f.name })),
    [options.facilities]
  );
  const formulationOptions = React.useMemo(
    () => formulations.map((f) => ({ value: f.id, label: f.name })),
    [formulations]
  );
  const biocharStorageOptions = React.useMemo(
    () => biocharStorageLocations.map((l) => ({ value: l.id, label: l.name })),
    [biocharStorageLocations]
  );
  const productStorageOptions = React.useMemo(
    () => productStorageLocations.map((l) => ({ value: l.id, label: l.name })),
    [productStorageLocations]
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isBiocharProductComplete(values);

        return (
          <FormPageLayout
            title={isEdit ? "Edit Biochar Product" : "New Biochar Product"}
            onSubmit={form.handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={form.state.isSubmitting}
            isDeleting={isDeleting}
            hasDraft={isEdit}
            isComplete={isComplete}
          >
            {/* Overview */}
            <FormSection title="Overview">
              <form.AppField name="facilityId">
                {(field) => (
                  <field.SelectField
                    label="Facility"
                    placeholder="Select facility"
                    options={facilityOptions}
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name="productionDate">
                {(field) => (
                  <field.DatePickerField
                    label="Production Date"
                    placeholder="Select date"
                  />
                )}
              </form.AppField>
            </FormSection>

            {/* Formulation */}
            <FormSection title="Formulation">
              <form.AppField name="formulationId">
                {(field) => (
                  <field.SelectField
                    label="Formulation"
                    placeholder="Select formulation"
                    options={formulationOptions}
                  />
                )}
              </form.AppField>

              <form.AppField name="totalWeightKg">
                {(field) => (
                  <field.NumberField
                    label="Total Weight"
                    unit="kg"
                    placeholder="Enter total weight"
                  />
                )}
              </form.AppField>

              <form.AppField name="totalVolumeLiters">
                {(field) => (
                  <field.NumberField
                    label="Total Volume"
                    unit="l"
                    placeholder="Enter total volume"
                  />
                )}
              </form.AppField>

              <form.AppField name="storageLocationId">
                {(field) => (
                  <field.SelectField
                    label="Storage Location"
                    placeholder="Select storage location"
                    options={productStorageOptions}
                  />
                )}
              </form.AppField>
            </FormSection>

            {/* Formulation Details */}
            <FormSection title="Formulation Details">
              <form.AppField name="biocharSourceStorageId">
                {(field) => (
                  <field.SelectField
                    label="Biochar Source"
                    placeholder="Select biochar source"
                    options={biocharStorageOptions}
                  />
                )}
              </form.AppField>

              <form.AppField name="biocharAmountKg">
                {(field) => (
                  <field.NumberField
                    label="Biochar Amount"
                    unit="kg"
                    placeholder="Enter biochar amount"
                  />
                )}
              </form.AppField>

              <form.AppField name="biocharPerM3Kg">
                {(field) => (
                  <field.NumberField
                    label="Biochar per m3"
                    unit="kg"
                    placeholder="Enter biochar per m3"
                  />
                )}
              </form.AppField>

              <form.AppField name="compostWeightKg">
                {(field) => (
                  <field.NumberField
                    label="Compost Amount"
                    unit="kg"
                    placeholder="Enter compost amount"
                  />
                )}
              </form.AppField>

              <form.AppField name="compostPerM3Kg">
                {(field) => (
                  <field.NumberField
                    label="Compost per m3"
                    unit="kg"
                    placeholder="Enter compost per m3"
                  />
                )}
              </form.AppField>
            </FormSection>

            {/* Documentation */}
            <FormSection title="Documentation">
              <form.AppField name="notes">
                {(field) => (
                  <field.TextareaField
                    label="Notes"
                    placeholder="Enter notes"
                  />
                )}
              </form.AppField>

              <PhotoUpload
                value={photos}
                onChange={setPhotos}
                label="Add photo or video"
                accept="image/*,video/*"
              />
            </FormSection>
          </FormPageLayout>
        );
      }}
    </form.Subscribe>
  );
}
