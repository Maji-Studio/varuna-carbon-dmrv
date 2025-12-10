"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createSample, updateSample, deleteSample } from "./actions";
import { isSamplingComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

interface ProductionRunOption {
  id: string;
  name: string;
  facilityId: string;
}

interface SampleData {
  id: string;
  productionRunId: string;
  samplingTime: Date;
  reactorId: string | null;
  operatorId: string | null;
  weightG: number | null;
  volumeMl: number | null;
  temperatureC: number | null;
  moisturePercent: number | null;
  ashPercent: number | null;
  volatileMatterPercent: number | null;
  notes: string | null;
}

interface SamplingFormProps {
  mode: "create" | "edit";
  initialData?: SampleData;
  options: {
    reactors: SelectOption[];
    operators: SelectOption[];
  };
  productionRuns: ProductionRunOption[];
}

export function SamplingForm({
  mode,
  initialData,
  options,
  productionRuns,
}: SamplingFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      productionRunId: initialData?.productionRunId ?? "",
      samplingTime: initialData?.samplingTime ?? new Date(),
      reactorId: initialData?.reactorId ?? "",
      operatorId: initialData?.operatorId ?? "",
      weightG: initialData?.weightG ?? undefined,
      volumeMl: initialData?.volumeMl ?? undefined,
      temperatureC: initialData?.temperatureC ?? undefined,
      moisturePercent: initialData?.moisturePercent ?? undefined,
      ashPercent: initialData?.ashPercent ?? undefined,
      volatileMatterPercent: initialData?.volatileMatterPercent ?? undefined,
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isSamplingComplete(value);

      const result = isEdit && initialData
        ? await updateSample(initialData.id, value)
        : await createSample(value);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Sample completed"
          : isEdit
            ? "Draft updated"
            : "Draft saved"
      );
      router.push("/data-entry");
      router.refresh();
    },
  });

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    const result = await deleteSample(initialData.id);
    if (!result.success) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Sample deleted");
    router.push("/data-entry");
    router.refresh();
  };

  // Memoized options
  const productionRunOptions = React.useMemo(
    () => productionRuns.map((pr) => ({ value: pr.id, label: pr.name })),
    [productionRuns]
  );
  const reactorOptions = React.useMemo(
    () => options.reactors.map((r) => ({ value: r.id, label: r.name })),
    [options.reactors]
  );
  const operatorOptions = React.useMemo(
    () => options.operators.map((o) => ({ value: o.id, label: o.name })),
    [options.operators]
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isSamplingComplete(values);

        return (
          <FormPageLayout
            title={isEdit ? "Edit Sampling" : "New Sampling"}
            onSubmit={form.handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={form.state.isSubmitting}
            isDeleting={isDeleting}
            hasDraft={isEdit}
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
