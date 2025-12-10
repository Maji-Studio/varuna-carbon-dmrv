"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createSample } from "./actions";
import type { SelectOption } from "../actions";

interface ProductionRunOption {
  id: string;
  name: string;
  facilityId: string;
}

interface SamplingFormPageProps {
  options: {
    reactors: SelectOption[];
    operators: SelectOption[];
  };
  productionRuns: ProductionRunOption[];
}

export function SamplingFormPage({ options, productionRuns }: SamplingFormPageProps) {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      productionRunId: "",
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
      await createSample(value);
      router.push("/data-entry");
    },
  });

  // Convert options to { value, label } format
  const productionRunOptions = productionRuns.map((pr) => ({ value: pr.id, label: pr.name }));
  const reactorOptions = options.reactors.map((r) => ({ value: r.id, label: r.name }));
  const operatorOptions = options.operators.map((o) => ({ value: o.id, label: o.name }));

  return (
    <FormPageLayout
      title="New Sampling"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField name="productionRunId">
          {(field) => (
            <field.SelectField
              label="Production Run"
              placeholder="Select production run"
              options={productionRunOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="samplingTime">
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
    </FormPageLayout>
  );
}
