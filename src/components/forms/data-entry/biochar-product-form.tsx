"use client";

import * as React from "react";
import { useAppForm } from "@/components/forms/form-context";
import { type BiocharProductFormValues } from "@/lib/validations/data-entry";
import { FormSheet } from "@/components/forms/form-sheet";
import { FormSection, FormHeader } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { z } from "zod";

// ============================================
// Types for select options
// ============================================

interface SelectOption {
  id: string;
  name: string;
  code?: string;
}

interface BiocharProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BiocharProductFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  formulations?: SelectOption[];
  storageLocations?: SelectOption[];
  defaultFacilityId?: string;
}

// ============================================
// Biochar Product Form Component
// ============================================

export function BiocharProductForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  formulations = [],
  storageLocations = [],
  defaultFacilityId,
}: BiocharProductFormProps) {
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
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
      await onSubmit({
        ...value,
        photos,
      } as BiocharProductFormValues);
      onOpenChange(false);
    },
  });

  // Field-level validators
  const requiredString = z.string().min(1, "Required");
  const positiveNumber = z.number().min(0, "Must be positive").optional();

  // Filter storage locations
  const biocharStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("biochar") ||
      loc.name.toLowerCase().includes("pile")
  );
  const productStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("product") ||
      loc.name.toLowerCase().includes("pile")
  );

  // Convert options to { value, label } format
  const facilityOptions = facilities.map((f) => ({ value: f.id, label: f.name }));
  const formulationOptions = formulations.map((f) => ({ value: f.id, label: f.name }));
  const biocharStorageOptions = biocharStorageLocations.map((l) => ({ value: l.id, label: l.name }));
  const productStorageOptions = productStorageLocations.map((l) => ({ value: l.id, label: l.name }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Biochar Product"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Biochar Product" />

      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField
          name="facilityId"
          validators={{
            onBlur: requiredString,
          }}
        >
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
              label="Biochar per m³"
              unit="kg"
              placeholder="Enter biochar per m³"
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
              label="Compost per m³"
              unit="kg"
              placeholder="Enter compost per m³"
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
    </FormSheet>
  );
}
