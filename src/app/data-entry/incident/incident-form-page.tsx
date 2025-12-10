"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createIncident } from "./actions";
import type { SelectOption } from "../actions";

interface ProductionRunOption {
  id: string;
  name: string;
  facilityId: string;
}

interface IncidentFormPageProps {
  options: {
    reactors: SelectOption[];
    operators: SelectOption[];
  };
  productionRuns: ProductionRunOption[];
}

export function IncidentFormPage({ options, productionRuns }: IncidentFormPageProps) {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      productionRunId: "",
      incidentTime: new Date(),
      reactorId: "" as string | undefined,
      operatorId: "" as string | undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      // Check completion at submit time
      const isCompleteAtSubmit = Boolean(value.productionRunId);

      const result = await createIncident(value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isCompleteAtSubmit ? "Incident report completed" : "Draft saved");
      router.push("/data-entry");
    },
  });

  // Convert options to { value, label } format
  const productionRunOptions = productionRuns.map((pr) => ({ value: pr.id, label: pr.name }));
  const reactorOptions = options.reactors.map((r) => ({ value: r.id, label: r.name }));
  const operatorOptions = options.operators.map((o) => ({ value: o.id, label: o.name }));

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = Boolean(values.productionRunId);

        return (
          <FormPageLayout
            title="New Incident Report"
            onSubmit={form.handleSubmit}
            isSubmitting={form.state.isSubmitting}
            isComplete={isComplete}
          >
      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField name="productionRunId">
          {(field) => (
            <field.SelectField
              label="Production Run"
              placeholder="Select production run"
              options={productionRunOptions}
              required
            />
          )}
        </form.AppField>

        <form.AppField name="incidentTime">
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
          </FormPageLayout>
        );
      }}
    </form.Subscribe>
  );
}
