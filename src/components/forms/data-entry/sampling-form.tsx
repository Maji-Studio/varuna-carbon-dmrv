"use client";

import * as React from "react";
import { useAppForm } from "@/components/forms/form-context";
import { type SamplingFormValues } from "@/lib/validations/data-entry";
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

interface SamplingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SamplingFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  reactors?: SelectOption[];
  operators?: SelectOption[];
  // If linked to a production run
  productionRunId?: string;
  defaultFacilityId?: string;
}

// ============================================
// Sampling Form Component
// ============================================

export function SamplingForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  reactors = [],
  operators = [],
  defaultFacilityId,
}: SamplingFormProps) {
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      samplingTime: new Date(),
      reactorId: "" as string | undefined,
      operatorId: "" as string | undefined,
      weightG: undefined as number | undefined,
      volumeMl: undefined as number | undefined,
      temperatureC: undefined as number | undefined,
      moisturePercent: undefined as number | undefined,
      ashPercent: undefined as number | undefined,
      volatileMatterPercent: undefined as number | undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        photos,
      } as SamplingFormValues);
      onOpenChange(false);
    },
  });

  // Field-level validators
  const requiredString = z.string().min(1, "Required");
  const requiredDate = z.date({ message: "Required" });

  // Convert options to { value, label } format
  const facilityOptions = facilities.map((f) => ({ value: f.id, label: f.name }));
  const reactorOptions = reactors.map((r) => ({ value: r.id, label: r.code ?? r.name }));
  const operatorOptions = operators.map((o) => ({ value: o.id, label: o.name }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Sampling"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Sampling" />

      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField
          name="facilityId"
          validators={{ onBlur: requiredString }}
        >
          {(field) => (
            <field.SelectField
              label="Facility"
              placeholder="Select facility"
              options={facilityOptions}
            />
          )}
        </form.AppField>

        <form.AppField
          name="samplingTime"
          validators={{ onBlur: requiredDate }}
        >
          {(field) => (
            <field.DateTimePickerField
              label="Sampling Time"
              placeholder="Select date and time"
            />
          )}
        </form.AppField>

        <form.AppField name="reactorId">
          {(field) => (
            <field.SelectField
              label="Reactor"
              placeholder="Select reactor"
              options={reactorOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="operatorId">
          {(field) => (
            <field.SelectField
              label="Operator"
              placeholder="Select operator"
              options={operatorOptions}
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Sampling Details */}
      <FormSection title="Sampling Details">
        <form.AppField name="weightG">
          {(field) => (
            <field.NumberField
              label="Weight"
              unit="g"
              placeholder="Enter weight"
            />
          )}
        </form.AppField>

        <form.AppField name="volumeMl">
          {(field) => (
            <field.NumberField
              label="Volume"
              unit="ml"
              placeholder="Enter volume"
            />
          )}
        </form.AppField>

        <form.AppField name="temperatureC">
          {(field) => (
            <field.NumberField
              label="Temperature"
              unit="°C"
              placeholder="Enter temperature"
            />
          )}
        </form.AppField>

        <form.AppField name="moisturePercent">
          {(field) => (
            <field.NumberField
              label="Moisture Content"
              unit="%"
              placeholder="Enter moisture content"
            />
          )}
        </form.AppField>

        <form.AppField name="ashPercent">
          {(field) => (
            <field.NumberField
              label="Ash"
              unit="%"
              placeholder="Enter ash content"
            />
          )}
        </form.AppField>

        <form.AppField name="volatileMatterPercent">
          {(field) => (
            <field.NumberField
              label="Volatile Matter"
              unit="%"
              placeholder="Enter volatile matter"
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
