"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createBiocharProduct } from "./actions";
import type { SelectOption } from "../actions";

interface BiocharProductFormPageProps {
  options: {
    facilities: SelectOption[];
    storageLocations: SelectOption[];
  };
  formulations: SelectOption[];
}

export function BiocharProductFormPage({ options, formulations }: BiocharProductFormPageProps) {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: "",
      productionDate: new Date() as Date | undefined,
      formulationId: "" as string | undefined,
      totalWeightKg: undefined as number | undefined,
      totalVolumeLiters: undefined as number | undefined,
      storageLocationId: "" as string | undefined,
      biocharSourceStorageId: "" as string | undefined,
      biocharAmountKg: undefined as number | undefined,
      biocharPerM3Kg: undefined as number | undefined,
      compostWeightKg: undefined as number | undefined,
      compostPerM3Kg: undefined as number | undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      await createBiocharProduct(value);
      router.push("/data-entry");
    },
  });

  // Filter storage locations
  const biocharStorageLocations = options.storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("biochar") ||
      loc.name.toLowerCase().includes("pile")
  );
  const productStorageLocations = options.storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("product") ||
      loc.name.toLowerCase().includes("pile")
  );

  // Convert options to { value, label } format
  const facilityOptions = options.facilities.map((f) => ({ value: f.id, label: f.name }));
  const formulationOptions = formulations.map((f) => ({ value: f.id, label: f.name }));
  const biocharStorageOptions = biocharStorageLocations.map((l) => ({ value: l.id, label: l.name }));
  const productStorageOptions = productStorageLocations.map((l) => ({ value: l.id, label: l.name }));

  return (
    <FormPageLayout
      title="New Biochar Product"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField name="facilityId">
          {(field) => (
            <field.SelectField
              label="Facility"
              placeholder="Select facility"
              options={facilityOptions}
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

        {/* Photos/Videos */}
        <PhotoUpload
          value={photos}
          onChange={setPhotos}
          label="Add photo or video"
          accept="image/*,video/*"
        />
      </FormSection>
    </FormPageLayout>
  );
}
