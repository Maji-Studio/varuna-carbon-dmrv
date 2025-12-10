"use client";

import * as React from "react";
import { useAppForm } from "@/components/forms/form-context";
import { type IncidentFormValues } from "@/lib/validations/data-entry";
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

interface IncidentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IncidentFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  reactors?: SelectOption[];
  operators?: SelectOption[];
  // If linked to a production run
  productionRunId?: string;
  defaultFacilityId?: string;
}

// ============================================
// Incident Form Component
// ============================================

export function IncidentForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  reactors = [],
  operators = [],
  defaultFacilityId,
}: IncidentFormProps) {
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      incidentTime: new Date(),
      reactorId: "" as string | undefined,
      operatorId: "" as string | undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        photos,
      } as IncidentFormValues);
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
      title="Add Incident"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Incident" />

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
          name="incidentTime"
          validators={{ onBlur: requiredDate }}
        >
          {(field) => (
            <field.DateTimePickerField
              label="Incident Time"
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
